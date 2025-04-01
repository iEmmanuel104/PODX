// controllers/calls.controller.ts
import { Response, Request } from 'express';
import { redisClient } from '../utils/redis';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import StreamIOConfig from '../clients/streamio.config';
import { CallSettings } from '@stream-io/node-sdk';
// import { POAPService } from '../services/poap.service';
import { Call } from '../models/Mongodb/call.model';
import { logger } from '../utils/logger';
import { validateDurationRequirement } from '../utils/validation';
import { PinataService, NFTMetadataInput } from '../utils/pinata';

// Extend the IUser interface to include isAdmin property
interface ExtendedUser {
    isAdmin?: boolean;
}

// Extend the AuthenticatedRequest to use our extended user
interface AdminAuthenticatedRequest extends AuthenticatedRequest {
    user: AuthenticatedRequest['user'] & ExtendedUser;
}

interface ScheduledCall {
    starts_at: string;
    id: string;
    custom: Record<string, any>;
    created_by: {
        id: string;
        name: string;
        custom: Record<string, any>;
    };
    [key: string]: any;
}

export default class CallsController {

    // all call controllers
    static async scheduleCall(req: AuthenticatedRequest, res: Response) {
        const { title, type, sessionId, starts_at, tokenGateContract, scheduledDuration = 60, durationRequirement } = req.body;

        // Validate duration requirement if provided
        validateDurationRequirement(durationRequirement);

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
                durationRequirement: {
                    value: durationRequirement?.value || 1, // Default to 1 second if not provided
                    type: durationRequirement?.type || 'absolute' // Default to absolute if not provided
                }
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

        // Create proper Call document with all required fields
        await Call.create({
            callId: sessionId,
            type: type,
            createdById: req.user.id,
            scheduledDuration: scheduledDuration,
            custom: {
                title,
                type,
                sessionId,
                tokenGateInfo,
                durationRequirement: {
                    value: durationRequirement?.value || 1,
                    type: durationRequirement?.type || 'absolute'
                }
            },
            startTime: startTime,
        });

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
                // Token gating is temporarily disabled during POAP service rewrite
                // const hasAccess = await POAPService.walletHasMeetingNFT(
                //     req.user.walletAddress,
                //     tokenGateInfo.contractAddress
                // );
                const hasAccess = true; // Temporarily allow access to all users
                console.log(`Token gating is temporarily disabled. User ${req.user.id} granted access to call ${sessionId}`);

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
        console.log(`Found ${sessionIds.length} scheduled call IDs for user ${req.user.id}`);

        const calls: ScheduledCall[] = [];
        const missingSessionIds: string[] = [];

        for (const sessionId of sessionIds) {
            const callKey = `scheduled_call:${sessionId}`;
            const callData = await redisClient.get(callKey);

            if (callData) {
                calls.push(JSON.parse(callData));
            } else {
                console.log(`Session ${sessionId} referenced in user's list but not found in Redis`);
                missingSessionIds.push(sessionId);
            }
        }

        // Clean up missing sessions from user's list
        if (missingSessionIds.length > 0) {
            console.log(`Cleaning up ${missingSessionIds.length} missing sessions from user ${req.user.id}'s list`);
            for (const sessionId of missingSessionIds) {
                await redisClient.srem(userScheduledCallsKey, sessionId);
                await redisClient.srem('all_scheduled_sessions', sessionId);
                console.log(`Removed missing session ${sessionId} from user's list`);
            }
        }

        // Sort calls by start time
        calls.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

        console.log(`Returning ${calls.length} valid scheduled calls for user ${req.user.id}`);
        res.status(200).json({
            status: 'success',
            message: 'User scheduled calls retrieved successfully',
            data: { calls },
        });
    }

    //  StreamIOConfigs
    static async createCall(req: AuthenticatedRequest, res: Response) {
        try {
            const { title, type, scheduledDate, tokenGatingAddresses, tokenGatingType, durationRequirement } = req.body;
            const image = req.file; // Multer will add the file here

            // Validate duration requirement if provided
            validateDurationRequirement(durationRequirement);

            let metadata;
            if (image) {
                try {
                    const imageBlob = new Blob([image.buffer], { type: image.mimetype });
                    const nftData: NFTMetadataInput = {
                        name: title,
                        description: `Call session: ${title}`,
                        image: imageBlob,
                        attributes: [
                            {
                                trait_type: "Type",
                                value: type
                            },
                            {
                                trait_type: "Creator",
                                value: req.user.username
                            }
                        ]
                    };

                    metadata = await PinataService.createNFTMetadata(nftData);
                } catch (error) {
                    console.error('Error uploading image to IPFS:', error);
                    // Continue without image if upload fails
                }
            }

            // Create custom object with token gating info if provided
            const custom: Record<string, any> = {
                title,
                type,
                durationRequirement: {
                    value: durationRequirement?.value || 1,
                    type: durationRequirement?.type || 'absolute'
                }
            };

            // Add metadata if available
            if (metadata) {
                custom.metadata = metadata;
            }

            // Add token gating info if provided
            if (tokenGatingAddresses && tokenGatingAddresses.length > 0) {
                if (tokenGatingType === 'external') {
                    custom.tokenGateInfo = {
                        enabled: true,
                        addresses: tokenGatingAddresses.map((addr: string) => addr.toLowerCase()),
                    };
                }
            }

            // Create Stream.io call
            const { call: createdCall } = await StreamIOConfig.createCall({
                data: {
                    custom,
                    settings: {
                        // Your existing settings
                    },
                    created_by: {
                        id: req.user.id,
                        name: req.user.username,
                        custom: {
                            username: req.user.username,
                        }
                    }
                }
            });

            // Create proper Call document with all required fields
            await Call.create({
                callId: createdCall.id,
                type: type,
                createdById: req.user.id,
                custom,
                startTime: new Date(),
            });

            // Return the new call object which includes the callId for external token gating
            res.status(201).json({
                status: 'success',
                message: 'Call created successfully',
                data: {
                    callId: createdCall.id,
                    custom
                },
            });
        } catch (error) {
            // Error handling
            console.error('Error creating call:', error);
            res.status(error instanceof BadRequestError ? 400 : 500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error creating call',
            });
        }
    }

    static async getOrCreateCall(req: AuthenticatedRequest, res: Response) {
        const { callType, callId, members, settings, durationRequirement } = req.body;

        // Validate duration requirement if provided
        validateDurationRequirement(durationRequirement);

        const callData = {
            created_by_id: req.user.id,
            members: members || [{ user_id: req.user.id }],
            settings_override: settings as CallSettings,
            custom: {
                durationRequirement: {
                    value: durationRequirement?.value || 1, // Default to 1 second if not provided
                    type: durationRequirement?.type || 'absolute' // Default to absolute if not provided
                }
            }
        };

        const { call, error } = await StreamIOConfig.getOrCreateCall(callType, callId, callData);

        if (error) {
            throw new BadRequestError(error.message);
        }

        // Create proper Call document if it doesn't exist
        await Call.findOneAndUpdate(
            { callId },
            {
                $setOnInsert: {
                    callId,
                    type: callType,
                    createdById: req.user.id,
                    custom: callData.custom,
                    startTime: new Date()
                }
            },
            { upsert: true, new: true }
        );

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

    static async endCall(req: AdminAuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { callId } = req.body;
            
            if (!callId) {
                throw new BadRequestError('Call ID is required');
            }

            // Ensure user is creator or has permission to end call
            const callDetails = await StreamIOConfig.getCallDetails(callId);

            if (!callDetails || !callDetails.call) {
                throw new BadRequestError('Call not found');
            }

            // Check if user is owner or has permission to end call
            if (
                callDetails.call.created_by?.id !== req.user.id &&
                !req.user.isAdmin
            ) {
                res.status(403).json({ 
                    status: 'error',
                    message: 'You do not have permission to end this call',
                });
                return;
            }

            // End the call via Stream API - fix by providing both required parameters
            const result = await StreamIOConfig.endCall('video', callId);

            if (!result.success) {
                throw new Error(`Failed to end call: ${result.error}`);
            }

            // Update call status in database
            await Call.findOneAndUpdate(
                { callId },
                {
                    status: 'ended',
                    endTime: new Date(),
                }
            );

            // Record call statistics
            logger.info(`Call ${callId} ended by user ${req.user.id}`);

            // POAP functionality is temporarily disabled during service rewrite
            // await POAPService.handleCallPOAP(callId);
            console.log(`POAP handling for call ${callId} is temporarily disabled and will be reimplemented`);

            res.status(200).json({
                status: 'success',
                message: 'Call ended successfully',
            });
        } catch (error) {
            logger.error('Error ending call:', error);
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error ending call',
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

    static async deleteScheduledCall(req: AuthenticatedRequest, res: Response) {
        const { sessionId } = req.params;
        console.log(`Attempting to delete session ${sessionId} by user ${req.user.id}`);

        try {
            // Get the call data
            const callKey = `scheduled_call:${sessionId}`;
            const callData = await redisClient.get(callKey);

            if (!callData) {
                console.log(`Session ${sessionId} not found in Redis`);

                // Check if the session ID exists in user's scheduled calls
                const userScheduledCallsKey = `user_scheduled_calls:${req.user.id}`;
                const isInUserList = await redisClient.sismember(userScheduledCallsKey, sessionId);

                if (isInUserList) {
                    console.log(`Session ID ${sessionId} found in user's list but not in Redis, cleaning up...`);
                    // Clean up the reference if it exists in the user's list
                    await redisClient.srem(userScheduledCallsKey, sessionId);
                    await redisClient.srem('all_scheduled_sessions', sessionId);

                    res.status(200).json({
                        status: 'success',
                        message: 'Session reference cleaned up successfully',
                    });
                    return;
                }

                // Session not found anywhere
                res.status(404).json({
                    status: 'error',
                    message: 'Scheduled call not found',
                    code: 'SESSION_NOT_FOUND',
                });
                return;
            }

            const parsedCallData = JSON.parse(callData);
            console.log(`Found session ${sessionId}, created by ${parsedCallData.created_by.id}`);

            // Check if the current user is the creator
            if (parsedCallData.created_by.id !== req.user.id) {
                console.log(`Unauthorized deletion attempt: user ${req.user.id} is not the creator ${parsedCallData.created_by.id}`);
                res.status(403).json({
                    status: 'error',
                    message: 'You are not authorized to delete this scheduled call',
                });
                return;
            }

            // Delete the call
            console.log(`Deleting session ${sessionId} from Redis...`);

            const delResult = await redisClient.del(callKey);
            console.log(`Redis DEL result for ${callKey}: ${delResult}`);

            const sremResult1 = await redisClient.srem('all_scheduled_sessions', sessionId);
            console.log(`Redis SREM result for all_scheduled_sessions: ${sremResult1}`);

            const sremResult2 = await redisClient.srem(`user_scheduled_calls:${req.user.id}`, sessionId);
            console.log(`Redis SREM result for user_scheduled_calls:${req.user.id}: ${sremResult2}`);

            console.log(`Successfully deleted session ${sessionId}`);
            res.status(200).json({
                status: 'success',
                message: 'Scheduled call deleted successfully',
            });
        } catch (error) {
            console.error(`Error deleting session ${sessionId}:`, error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete scheduled call',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}