import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import StreamIOConfig from '../clients/streamio.config';
import { AuthUtil } from '../utils/token';
import { Call } from '../models/Mongodb/call.model';
import { User } from '../models/Mongodb/user.model';
import { UserStreak } from '../models/Mongodb/userStreak.model';
import { WebhookService } from '../services/webhook.service';
interface ProcessingError {
    userId?: string;
    callId?: string;
    error: string;
    timestamp: Date;
}

interface ProcessingSummary {
    totalUsersProcessed: number;
    totalCallsProcessed: number;
    totalStreakUpdates: number;
    errors: ProcessingError[];
    processingTime: number;
}

export default class UserController {

    static async getAllUsers(req: AuthenticatedRequest, res: Response) {
        const { page, size, q, isBlocked, isDeactivated } = req.query;
        const queryParams: Record<string, unknown> = {};

        if (page && size) {
            queryParams.page = Number(page);
            queryParams.size = Number(size);
        }

        // Add filters for blocked and deactivated users
        if (isBlocked !== undefined) {
            queryParams.isBlocked = isBlocked === 'true';
        }

        if (isDeactivated !== undefined) {
            queryParams.isDeactivated = isDeactivated === 'true';
        }

        // Add search query if provided
        if (q) {
            queryParams.q = q as string;
        }

        const users = await UserService.viewUsers(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Users retrieved successfully',
            data: { ...users },
        });
    }

    static async getUser(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;

        const user = await UserService.viewSingleUser(id as string);

        res.status(200).json({
            status: 'success',
            message: 'User retrieved successfully',
            data: user,
        });
    }

    static async updateUser(req: AuthenticatedRequest, res: Response) {
        const { username, displayImage, isDeactivated } = req.body;

        // eslint-disable-next-line no-undef
        const file = req.file as Express.Multer.File | undefined;
        let url;
        if (file) {
            const result = await CloudinaryClientConfig.uploadtoCloudinary({
                fileBuffer: file.buffer,
                id: req.user.id,
                name: file.originalname,
                type: 'image',
            });
            url = result.url as string;
        } else if (displayImage) {
            url = displayImage;
        }

        // Prepare the update data for the user profile
        const updateData = {
            ...(username && { username }),
            ...(url && { displayImage: url }),
        };

        // Only update settings if isDeactivated is provided in the request body
        let settingsData = {};
        if (isDeactivated !== undefined && isDeactivated === 'true') {
            const state: boolean = isDeactivated === 'true';
            settingsData = {
                ...(req.user.settings && state === req.user.settings.isDeactivated ? {} : { isDeactivated: state }),
            };
        }

        const dataKeys = Object.keys(updateData);
        const settingsKeys = Object.keys(settingsData);

        if (dataKeys.length === 0 && settingsKeys.length === 0) {
            throw new BadRequestError('No new data to update');
        }

        // Update user settings if necessary
        if (settingsKeys.length > 0) {
            await UserService.updateUserSettings(req.user.id, settingsData);
        }

        // Update user profile data if necessary
        const updatedUser = dataKeys.length > 0
            ? await UserService.updateUser(req.user.id, updateData)
            : req.user;

        await StreamIOConfig.updateUser(updatedUser);

        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: updatedUser,
        });
    }

    static async findOrCreateUser(req: Request, res: Response) {
        const { walletAddress, hash } = req.body;

        if (!walletAddress) {
            throw new BadRequestError('Wallet address is required');
        }

        let user = await UserService.viewSingleUserByWalletAddress(walletAddress);
        let firstTimeUser = false;
        if (!user) {
            // Create a new user
            const username = `guest-${walletAddress.slice(0, 8)}`;
            user = await UserService.addUser({ walletAddress, username });
            firstTimeUser = true;
        }

        const streamToken = await StreamIOConfig.generateToken(user.id);

        // Convert Mongoose document to a plain JavaScript object
        const userObject = user.toObject();

        // Remove any fields you don't want to send to the client
        delete userObject.__v;

        let signature = undefined;

        if (hash === 'true') {
            // Generate a new auth token with a unique hash
            signature = await AuthUtil.generateTokenWithHash({
                type: 'access',
                user: {
                    id: user.id,
                    walletAddress: user.walletAddress,
                },
            });
        }

        console.log('user data retrieved for: ', userObject.username);

        res.status(200).json({
            status: 'success',
            message: firstTimeUser ? 'New user created' : 'Existing user found',
            data: {
                ...userObject,
                streamToken,
                signature,
                firstTimeUser,
            },
        });
    }

    static async getUserStreakStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const stats = await UserService.getUserStreakStats(req.user.id);
            res.status(200).json({
                status: 'success',
                data: stats,
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching user statistics',
            });
        }
    }

    static async getUserCalls(req: AuthenticatedRequest, res: Response) {
        const { calls, error } = await StreamIOConfig.getCallsByUser('6715e4e75dcaacba9b74d1f0');

        if (error) {
            throw new BadRequestError(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'User calls retrieved successfully',
            data: { calls },
        });
    }

    private static async fetchAndProcessCalls(userId: string): Promise<{
        calls: any[];
        errors: ProcessingError[];
    }> {
        try {
            console.log(`[Sync] Fetching calls for user ${userId}`);
            const { calls, error } = await StreamIOConfig.getCallsByUser(userId);

            if (error) {
                return {
                    calls: [],
                    errors: [{
                        userId,
                        error: `Failed to fetch calls: ${error.message}`,
                        timestamp: new Date()
                    }]
                };
            }

            return { calls, errors: [] };
        } catch (error) {
            return {
                calls: [],
                errors: [{
                    userId,
                    error: `Error processing user calls: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date()
                }]
            };
        }
    }

    private static async processCallBatch(calls: any[]): Promise<{
        callsToCreate: any[];
        streakUpdates: any[];
        errors: ProcessingError[];
    }> {
        const callsToCreate = [];
        const streakUpdates: { userId: any; callActivity: { date: Date; callId: any; duration: number; isCreator: boolean; points: number; }; activityDate: Date; }[] = [];
        const errors: ProcessingError[] = [];

        // Get existing call IDs in bulk to avoid individual queries
        const existingCallIds = new Set(
            (await Call.find({
                callId: { $in: calls.map(c => c.call.id) }
            }).select('callId')).map(c => c.callId)
        );

        for (const { call, members } of calls) {
            try {
                if (existingCallIds.has(call.id)) {
                    continue;
                }

                const callDoc = {
                    callId: call.id,
                    type: call.type,
                    createdById: call.created_by.id,
                    status: call.ended_at ? 'ended' : 'live',
                    members: members.map((member: { user_id: any; role: any; }) => ({
                        userId: member.user_id,
                        role: member.role,
                    })),
                    startTime: new Date(call.created_at),
                    endTime: call.ended_at ? new Date(call.ended_at) : undefined,
                    custom: call.custom,
                };

                callsToCreate.push(callDoc);

                if (call.ended_at) {
                    const duration = Math.floor(
                        (new Date(call.ended_at).getTime() - new Date(call.created_at).getTime()) / 1000
                    );

                    await Promise.all(members.map(async (member: { user_id: any; }) => {
                        const isCreator = member.user_id === call.created_by.id;
                        const points = await WebhookService.calculatePoints(duration, isCreator);

                        streakUpdates.push({
                            userId: member.user_id,
                            callActivity: {
                                date: new Date(call.created_at),
                                callId: call.id,
                                duration,
                                isCreator,
                                points,
                            },
                            activityDate: new Date(call.created_at),
                        });
                    }));
                }
            } catch (error) {
                errors.push({
                    callId: call.id,
                    error: `Failed to process call: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date()
                });
            }
        }

        return { callsToCreate, streakUpdates, errors };
    }

    private static async updateStreaksBatch(updates: any[]): Promise<ProcessingError[]> {
        const errors: ProcessingError[] = [];
        const batchSize = 50; // Adjust based on your system's capacity

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);

            await Promise.all(batch.map(async update => {
                try {
                    await WebhookService.updateStreak(update.userId, update.activityDate);
                    await UserStreak.findOneAndUpdate(
                        { userId: update.userId },
                        {
                            $push: { callActivities: update.callActivity },
                            $inc: { totalPoints: update.callActivity.points },
                        },
                        { upsert: true }
                    );
                } catch (error) {
                    errors.push({
                        userId: update.userId,
                        error: `Failed to update streak: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        timestamp: new Date()
                    });
                }
            }));
        }

        return errors;
    }

    static async syncUserStreaks(req: Request, res: Response) {
        const startTime = Date.now();
        const summary: ProcessingSummary = {
            totalUsersProcessed: 0,
            totalCallsProcessed: 0,
            totalStreakUpdates: 0,
            errors: [],
            processingTime: 0
        };

        try {
            console.log('[Sync] Starting user streaks synchronization');
            const users = await User.find({}).select('_id').lean().exec();
            const batchSize = 10; // Adjust based on your system's capacity

            for (let i = 0; i < users.length; i += batchSize) {
                const userBatch = users.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    userBatch.map(user => UserController.fetchAndProcessCalls((user._id as string).toString()))
                );

                const allCalls = batchResults.flatMap(result => result.calls);
                const batchErrors = batchResults.flatMap(result => result.errors);
                summary.errors.push(...batchErrors);

                if (allCalls.length > 0) {
                    const { callsToCreate, streakUpdates, errors: processErrors } =
                        await UserController.processCallBatch(allCalls);

                    if (callsToCreate.length > 0) {
                        await Call.insertMany(callsToCreate, { ordered: false });
                        summary.totalCallsProcessed += callsToCreate.length;
                    }

                    if (streakUpdates.length > 0) {
                        const updateErrors = await UserController.updateStreaksBatch(streakUpdates);
                        summary.totalStreakUpdates += streakUpdates.length;
                        summary.errors.push(...updateErrors);
                    }

                    summary.errors.push(...processErrors);
                }

                summary.totalUsersProcessed += userBatch.length;
                console.log(`[Sync] Processed ${summary.totalUsersProcessed}/${users.length} users`);
            }

            summary.processingTime = Date.now() - startTime;
            console.log('[Sync] Synchronization completed', summary);

            res.status(200).json({
                status: 'success',
                message: 'User streaks synchronized successfully',
                data: {
                    summary,
                    errors: summary.errors.length > 0 ? summary.errors : undefined
                }
            });
        } catch (error) {
            console.error('[Sync] Critical error during synchronization:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error syncing user streaks',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                summary
            });
        }
    }
}
