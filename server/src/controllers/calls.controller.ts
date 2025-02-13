// controllers/calls.controller.ts
import { Response, Request } from 'express';
import { redisClient } from '../utils/redis';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from 'middlewares/authMiddleware';
import StreamIOConfig from '../clients/streamio.config';
import { CallSettings } from '@stream-io/node-sdk';

export default class CallsController {

    // all call controllers
    static async scheduleCall(req: AuthenticatedRequest, res: Response) {
        const { title, type, sessionId, starts_at, tokenGate } = req.body;

        const startTime = new Date(starts_at);
        const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000);
        const now = new Date();

        if (startTime < now) {
            throw new BadRequestError('Cannot schedule calls in the past');
        }

        const callData = {
            id: sessionId,
            custom: {
                title,
                type,
                sessionId,
            },
            starts_at,
            created_by: {
                id: req.user.id,
                name: req.user.username,
                custom: {
                    username: req.user.username,
                },
            },
            created_at: now.toISOString(),
            tokenGate,
        };

        // Store in global sessions set for searching
        await redisClient.sadd('all_scheduled_sessions', sessionId);

        // Store call data with creator ID
        const callKey = `scheduled_call:${sessionId}`;
        await redisClient.set(callKey, JSON.stringify(callData));
        await redisClient.expireat(callKey, Math.floor(expiryTime.getTime() / 1000));

        // Store in user's scheduled calls set
        const userScheduledCallsKey = `user_scheduled_calls:${req.user.id}`;
        await redisClient.sadd(userScheduledCallsKey, sessionId);

        res.status(200).json({
            status: 'success',
            message: 'Call scheduled successfully',
            data: callData,
        });
    }

    static async getCall(req: AuthenticatedRequest, res: Response) {
        const { sessionId } = req.params;

        // First check Stream.io for active call
        const { call: streamCall, error: streamError } = await StreamIOConfig.getCallDetails(sessionId);

        if (streamCall) {
            res.status(200).json({
                status: 'success',
                message: 'Call retrieved successfully',
                data: {
                    call: streamCall,
                    source: 'stream',
                    hasJoined: false, // Stream.io manages this separately
                    participants: streamCall.session?.participants?.length || 0,
                },
            });
            return;
        }

        if (streamError) {
            console.warn('Stream.io error:', streamError);
            // Continue to check Redis even if Stream.io throws an error
        }

        // If not found in Stream.io, check Redis for scheduled call
        const callKey = `scheduled_call:${sessionId}`;
        const callData = await redisClient.get(callKey);

        if (!callData) {
            res.status(200).json({
                status: 'success',
                message: 'No call found',
                data: null,
            });
            return;
        }

        const parsedCallData = JSON.parse(callData);

        // Check if the current user has joined this session
        const userJoinedKey = `session_participants:${sessionId}`;
        const participants = await redisClient.smembers(userJoinedKey);
        const hasJoined = participants.includes(req.user.id);

        // Check if the scheduled call has expired
        const startTime = new Date(parsedCallData.starts_at);
        const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes after start time
        const now = new Date();

        if (now > expiryTime) {
            // Remove expired call data
            await redisClient.del(callKey);
            await redisClient.srem('all_scheduled_sessions', sessionId);
            await redisClient.srem(`user_scheduled_calls:${parsedCallData.created_by.id}`, sessionId);

            res.status(200).json({
                status: 'success',
                message: 'Call has expired',
                data: null,
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Scheduled call retrieved successfully',
            data: {
                call: parsedCallData,
                source: 'scheduled',
                hasJoined,
                participants: participants.length,
            },
        });

    }

    static async getUserScheduledCalls(req: AuthenticatedRequest, res: Response) {
        const userScheduledCallsKey = `user_scheduled_calls:${req.user.id}`;
        const sessionIds = await redisClient.smembers(userScheduledCallsKey);

        const calls = [];
        for (const sessionId of sessionIds) {
            const callKey = `scheduled_call:${sessionId}`;
            const callData = await redisClient.get(callKey);

            if (callData) {
                calls.push(JSON.parse(callData));
            }
        }

        // Sort calls by start time
        calls.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

        res.status(200).json({
            status: 'success',
            message: 'User scheduled calls retrieved successfully',
            data: { calls },
        });
    }

    //  StreamIOConfigs
    static async createCall(req: AuthenticatedRequest, res: Response) {
        const { callType, callId, members, settings, ring = false } = req.body;

        if (!callType || !callId) {
            throw new BadRequestError('Call type and ID are required');
        }

        const callData = {
            created_by_id: req.user.id,
            members: members || [{ user_id: req.user.id }],
            settings_override: settings as CallSettings,
        };

        const { call, error } = await StreamIOConfig.createCall(callType, callId, callData, ring);

        if (error) {
            throw new BadRequestError(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Call created successfully',
            data: { call },
        });
    }

    static async getOrCreateCall(req: AuthenticatedRequest, res: Response) {
        const { callType, callId, members, settings } = req.body;

        const callData = {
            created_by_id: req.user.id,
            members: members || [{ user_id: req.user.id }],
            settings_override: settings as CallSettings,
        };

        const { call, error } = await StreamIOConfig.getOrCreateCall(callType, callId, callData);

        if (error) {
            throw new BadRequestError(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Call retrieved/created successfully',
            data: { call },
        });
    }

    static async updateCallSettings(req: AuthenticatedRequest, res: Response) {
        const { callType, callId, settings } = req.body;

        const { success, error } = await StreamIOConfig.updateCallSettings(
            callType,
            callId,
            settings as CallSettings
        );

        if (!success) {
            throw new BadRequestError(error?.message || 'Failed to update call settings');
        }

        res.status(200).json({
            status: 'success',
            message: 'Call settings updated successfully',
        });
    }

    static async updateCallMembers(req: AuthenticatedRequest, res: Response) {
        const { callType, callId, updateMembers, removeMembers } = req.body;

        const { success, error } = await StreamIOConfig.updateCallMembers(
            callType,
            callId,
            updateMembers,
            removeMembers
        );

        if (!success) {
            throw new BadRequestError(error?.message || 'Failed to update call members');
        }

        res.status(200).json({
            status: 'success',
            message: 'Call members updated successfully',
        });
    }

    static async endCall(req: AuthenticatedRequest, res: Response) {
        const { callType, callId } = req.body;

        const { success, error } = await StreamIOConfig.endCall(callType, callId);

        if (!success) {
            throw new BadRequestError(error?.message || 'Failed to end call');
        }

        res.status(200).json({
            status: 'success',
            message: 'Call ended successfully',
        });
    }

    // call information
    static async getCallStats(req: Request, res: Response) {
        const { startDate, endDate, page = '1', size = '100', next } = req.query;

        try {
            let start: Date | undefined;
            let end: Date | undefined;
            const pageNumber = parseInt(page as string, 10);
            const pageSize = parseInt(size as string, 10);

            // Validate pagination parameters
            if (isNaN(pageNumber) || pageNumber < 1) {
                throw new BadRequestError('Invalid page number');
            }

            if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
                throw new BadRequestError('Invalid page size. Must be between 1 and 100');
            }

            // Validate dates if provided
            if (startDate) {
                start = new Date(startDate as string);
                if (isNaN(start.getTime())) {
                    throw new BadRequestError('Invalid start date format');
                }
            }

            if (endDate) {
                end = new Date(endDate as string);
                if (isNaN(end.getTime())) {
                    throw new BadRequestError('Invalid end date format');
                }
            }

            const response = await StreamIOConfig.getCallStats(
                start,
                end,
                pageNumber,
                pageSize,
                next as string | undefined
            );

            if (response.error) {
                console.error('Stream API error:', response.error);
                throw new BadRequestError('Failed to retrieve call statistics');
            }

            res.status(200).json({
                status: 'success',
                message: 'Call statistics retrieved successfully',
                data: {
                    stats: response.stats,
                    calls: response.calls,
                    pagination: response.pagination,
                },
            });
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            console.error('Error getting call stats:', error);
            throw new BadRequestError('Failed to retrieve call statistics');
        }
    }

    static async getDetailedCallStats(req: Request, res: Response) {
        const { startDate, endDate, size = '100', next } = req.query;

        try {
            // Validate and parse parameters
            const pageSize = parseInt(size as string, 10);
            if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
                throw new BadRequestError('Invalid page size. Must be between 1 and 100');
            }

            // Parse dates if provided
            let start: Date | undefined;
            let end: Date | undefined;

            if (startDate) {
                start = new Date(startDate as string);
                if (isNaN(start.getTime())) {
                    throw new BadRequestError('Invalid start date format');
                }
            }

            if (endDate) {
                end = new Date(endDate as string);
                if (isNaN(end.getTime())) {
                    throw new BadRequestError('Invalid end date format');
                }
            }

            const response = await StreamIOConfig.getDetailedCallStats(
                start,
                end,
                pageSize,
                next as string | undefined
            );

            if (response.error) {
                throw new BadRequestError('Failed to retrieve call statistics');
            }

            res.status(200).json({
                status: 'success',
                message: 'Call statistics retrieved successfully',
                data: {
                    analytics: response.analytics,
                    reports: response.reports,
                    pagination: response.pagination,
                    duration: response.duration,
                },
            });
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            console.error('Error getting detailed call stats:', error);
            throw new BadRequestError('Failed to retrieve call statistics');
        }
    }

    static async queryCallMembers(req: Request, res: Response) {
        const { callType, callId } = req.body;
        const { filter, sort, limit, next } = req.query;

        try {
            // Validate required parameters
            if (!callType || !callId) {
                throw new BadRequestError('Call type and ID are required');
            }

            // Validate and parse limit if provided
            let parsedLimit: number | undefined;
            if (limit) {
                parsedLimit = parseInt(limit as string, 10);
                if (isNaN(parsedLimit) || parsedLimit < 1) {
                    throw new BadRequestError('Invalid limit parameter');
                }
            }

            // Parse and validate sort parameter if provided
            let parsedSort: Array<{ field: string; direction: 1 | -1 }> | undefined;
            if (sort) {
                try {
                    const sortArray = Array.isArray(sort) ? sort : [sort];
                    parsedSort = sortArray.map(item => {
                        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                        if (!parsed.field || !parsed.direction || ![1, -1].includes(parsed.direction)) {
                            throw new Error('Invalid sort format');
                        }
                        return { field: parsed.field, direction: parsed.direction as 1 | -1 };
                    });
                } catch (err) {
                    console.log(err);
                    throw new BadRequestError('Sort must be an array of { field, direction } objects');
                }
            }

            const parsedFilter = filter ? JSON.parse(filter as string) : undefined;
            const options = {
                filter_conditions: parsedFilter,
                sort: parsedSort,
                limit: parsedLimit,
                next: next as string,
            };

            const { members, next: nextToken, error } = await StreamIOConfig.queryCallMembers(
                callType,
                callId,
                options
            );

            if (error) {
                throw new BadRequestError(error.message);
            }

            res.status(200).json({
                status: 'success',
                message: 'Call members retrieved successfully',
                data: {
                    members,
                    pagination: {
                        next: nextToken,
                        hasMore: Boolean(nextToken),
                    },
                },
            });
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            console.error('Error querying call members:', error);
            throw new BadRequestError('Failed to query call members');
        }
    }
}