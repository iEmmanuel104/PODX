// controllers/calls.controller.ts
import { Response, Request } from 'express';
import { redisClient } from '../utils/redis';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import StreamIOConfig from '../clients/streamio.config';
import { CallSettings } from '@stream-io/node-sdk';
import { POAPService } from '../services/poap.service';
import { Call } from '../models/Mongodb/call.model';
import { logger } from '../utils/logger';

export default class CallsController {

    // all call controllers
    static async scheduleCall(req: AuthenticatedRequest, res: Response) {
        const { title, type, sessionId, starts_at, tokenGateContract } = req.body;

        const startTime = new Date(starts_at);
        const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000);
        const now = new Date();

        if (startTime < now) {
            throw new BadRequestError('Cannot schedule calls in the past');
        }

        const tokenGateInfo = tokenGateContract ? {
            enabled: true,
            contractAddress: tokenGateContract,
        } : null;

        const callData = {
            id: sessionId,
            custom: {
                title,
                type,
                sessionId,
                tokenGateInfo,
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

        await Call.create(callData);

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
            // Check whitelist for stream call
            const whitelistedUsers = streamCall.custom?.whitelistedUsers;
            console.log({ whitelistedUsers, streamCall });

            const tokenGateInfo = (streamCall.custom?.tokenGateInfo as any);

            if (tokenGateInfo?.enabled && tokenGateInfo?.contractAddress) {
                const hasAccess = await POAPService.walletHasMeetingNFT(
                    req.user.walletAddress,
                    tokenGateInfo.contractAddress
                );

                if (!hasAccess) {
                    res.status(403).json({
                        status: 'error',
                        message: 'You do not have the required NFT to join this call',
                    });
                    return;
                }
            }

            res.status(200).json({
                status: 'success',
                message: 'Call retrieved successfully',
                data: {
                    call: streamCall,
                    source: 'stream',
                    hasJoined: false,
                    participants: streamCall.session?.participants?.length || 0,
                },
            });
            return;
        }

        if (streamError) {
            console.warn('Stream.io error:', streamError);
        }

        // Check Redis for scheduled call
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

        // Check whitelist for scheduled call
        const whitelistedUsers = (parsedCallData.custom as any)?.whitelistedUsers;

        if (whitelistedUsers && Array.isArray(whitelistedUsers)) {
            const isWhitelisted = whitelistedUsers.includes(req.user.id);

            if (!isWhitelisted) {
                res.status(403).json({
                    status: 'error',
                    message: 'You are not whitelisted to join this scheduled call',
                });
                return;
            }
        }

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
        try {
            const { title, type, scheduledDate, tokenGatingAddresses, tokenGatingType } = req.body;

            // Create custom object with token gating info if provided
            const custom: Record<string, any> = {
                title,
                type,
            };

            // Add token gating info if provided
            if (tokenGatingAddresses && tokenGatingAddresses.length > 0) {
                if (tokenGatingType === 'external') {
                    custom.tokenGateInfo = {
                        enabled: true,
                        addresses: tokenGatingAddresses.map((addr: string) => addr.toLowerCase()),
                    };
                }
                // For internal type, the addresses will be used for POAP verification
                // which is handled during access check
            }

            // Create Stream.io call
            const { call: createdCall } = await StreamIOConfig.createCall({
                data: {
                    custom,
                    settings: {
                        // Your existing settings
                    },
                    // Other call properties
                },
                // Rest of your code
            });

            // Return the new call object which includes the callId for external token gating
            res.status(201).json({
                status: 'success',
                message: 'Call created successfully',
                data: {
                    callId: createdCall.id,
                    // Other call properties
                }
            });
        } catch (error) {
            // Error handling
        }
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

    static async endCall(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { callId } = req.body;
            
            // Get full call details
            const call = await Call.findOne({ callId });
            if (!call) {
                res.status(404).json({ success: false, message: "Call not found" });
                return;
            }

            // Verify requester is creator
            if (call.createdById.toString() !== req.user?.id) {
                res.status(403).json({ 
                    success: false, 
                    message: "Only call creator can end the session" 
                });
                return;
            }

            // Immediate update to ended status
            const endedCall = await Call.findOneAndUpdate(
                { callId },
                { $set: { status: "ended", endedAt: new Date() } },
                { new: true, lean: true }  // Add lean for faster response
            );

            if (!endedCall) {
                res.status(404).json({ success: false, message: "Call not found" });
                return;
            }

            // Send immediate response
            res.status(200).json({
                success: true,
                message: "Call ended successfully",
                data: endedCall
            });

            // Process POAP in background
            setImmediate(async () => {
                try {
                    await POAPService.handleCallPOAP(callId);
                    console.log(`POAP process completed for call ${callId}`);
                } catch (poapError) {
                    console.error(`POAP generation failed: ${poapError}`);
                }
            });

        } catch (error) {
            logger.error("Error ending call:", error);
            res.status(500).json({
                success: false,
                message: "Failed to end call",
                error: (error as Error).message
            });
        }
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