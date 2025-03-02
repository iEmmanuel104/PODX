/* eslint-disable @typescript-eslint/no-explicit-any */
import { Call } from '../models/Mongodb/call.model';
import { UserStreak, ICallActivity, IStreakStats } from '../models/Mongodb/userStreak.model';
import { webhookConfig } from '../clients/webhook.config';
import { User } from '../models/Mongodb/user.model';
import StreamIOConfig from '../clients/streamio.config';
import { ProcessingError, ProcessingSummary } from '../utils/interface';

export class StreakService {
    private static readonly WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

    static async calculatePoints(duration: number, isCreator: boolean): Promise<number> {
        const { POINTS_CONFIG } = webhookConfig;
        let points = Math.floor(duration / 60) * POINTS_CONFIG.POINTS_PER_MINUTE;

        if (isCreator) {
            points = Math.floor(points * POINTS_CONFIG.CREATOR_BONUS_MULTIPLIER);
            points += POINTS_CONFIG.CALL_CREATION;
        }

        for (const threshold of POINTS_CONFIG.BONUS_THRESHOLDS) {
            if (duration >= threshold.duration) {
                points += threshold.points;
            }
        }

        return points;
    }

    private static async calculateUserCallStats(userId: string): Promise<IStreakStats> {
        const [createdCalls, participatedCalls, allCalls] = await Promise.all([
            Call.find({ createdById: userId, status: 'ended' }),
            Call.find({
                'members.userId': userId,
                createdById: { $ne: userId },
                status: 'ended',
            }),
            Call.find({
                $or: [
                    { createdById: userId },
                    { 'members.userId': userId },
                ],
                status: 'ended',
            }),
        ]);

        const durations = allCalls.map(call => call.duration || 0);
        const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
        const lastCall = allCalls.sort((a, b) =>
            (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0)
        )[0];

        return {
            createdCalls: createdCalls.length,
            participatedCalls: participatedCalls.length,
            totalCalls: allCalls.length,
            averageCallDuration: totalDuration / allCalls.length || 0,
            totalCallDuration: totalDuration,
            longestCallDuration: Math.max(...durations, 0),
            lastCallDate: lastCall?.endTime,
        };
    }

    private static async calculateStreakData(userId: string): Promise<{
        currentStreak: number;
        longestStreak: number;
        streakHistory: Array<{ date: Date; streak: number }>;
        lastActivityDate?: Date;
    }> {
        const calls = await Call.find({
            $or: [{ createdById: userId }, { 'members.userId': userId }],
            status: 'ended',
            endTime: { $exists: true },
        }).sort({ endTime: 1 });

        let currentStreak = 0;
        let longestStreak = 0;
        let lastActivityDate: Date | null = null;
        const streakHistory: Array<{ date: Date; streak: number }> = [];
        const processedDates = new Set<string>();

        for (const call of calls) {
            if (!call.endTime) continue;

            const dateStr = call.endTime.toISOString().split('T')[0];
            if (processedDates.has(dateStr)) continue;
            processedDates.add(dateStr);

            const callDate = call.endTime;

            if (!lastActivityDate) {
                currentStreak = 1;
                lastActivityDate = callDate;
            } else {
                const timeDiff = callDate.getTime() - lastActivityDate.getTime();

                if (timeDiff > this.WEEK_IN_MS) {
                    currentStreak = 1;
                } else {
                    const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
                    if (daysDiff === 1) {
                        currentStreak++;
                    } else if (daysDiff > 1) {
                        currentStreak = 1;
                    }
                }
                lastActivityDate = callDate;
            }

            longestStreak = Math.max(longestStreak, currentStreak);
            streakHistory.push({ date: callDate, streak: currentStreak });
        }

        // Check if current streak is still active
        if (lastActivityDate) {
            const now = new Date();
            if ((now.getTime() - lastActivityDate.getTime()) > this.WEEK_IN_MS) {
                currentStreak = 0;
            }
        }

        return {
            currentStreak,
            longestStreak,
            streakHistory,
            lastActivityDate: lastActivityDate || undefined,
        };
    }

    private static async generateCallActivities(userId: string): Promise<{
        activities: ICallActivity[];
        totalPoints: number;
    }> {
        const calls = await Call.find({
            $or: [{ createdById: userId }, { 'members.userId': userId }],
            status: 'ended',
            endTime: { $exists: true },
        }).sort({ endTime: 1 });

        let totalPoints = 0;
        const activities: ICallActivity[] = [];

        for (const call of calls) {
            if (!call.endTime || !call.duration) continue;

            const isCreator = call.createdById.toString() === userId;
            const points = await this.calculatePoints(call.duration, isCreator);
            totalPoints += points;

            activities.push({
                date: call.endTime,
                callId: call.callId,
                duration: call.duration,
                isCreator,
                points,
            });
        }

        return { activities, totalPoints };
    }

    static async updateUserStreakStats(userId: string): Promise<void> {
        console.log(`[Streak Update] Starting for user ${userId}`);

        try {
            const [stats, streakData, activityData] = await Promise.all([
                this.calculateUserCallStats(userId),
                this.calculateStreakData(userId),
                this.generateCallActivities(userId),
            ]);

            const update = {
                currentStreak: streakData.currentStreak,
                longestStreak: streakData.longestStreak,
                streakHistory: streakData.streakHistory,
                lastActivityDate: streakData.lastActivityDate,
                totalPoints: activityData.totalPoints,
                callActivities: activityData.activities,
                stats,
            };

            await UserStreak.findOneAndUpdate(
                { userId },
                { $set: update },
                { upsert: true, new: true }
            );

            console.log(`[Streak Update] Completed for user ${userId}`);
        } catch (error) {
            console.error(`[Streak Update] Error for user ${userId}:`, error);
            throw error;
        }
    }

    static async recalculateAllUserStreaks(batchSize = 10): Promise<{
        processedUsers: number;
        errors: Array<{ userId: string; error: string }>;
    }> {
        const users = await User.find({}).select('_id');
        const errors: Array<{ userId: string; error: string }> = [];
        let processedUsers = 0;

        console.log(`[Batch Streak Update] Starting for ${users.length} users`);

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.all(
                batch.map(async (user) => {
                    try {
                        await this.updateUserStreakStats((user as any)?._id.toString());
                        processedUsers++;
                    } catch (error) {
                        errors.push({
                            userId: (user as any)?._id.toString(),
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                })
            );

            console.log(`[Batch Streak Update] Processed ${processedUsers}/${users.length} users`);
        }

        console.log(`[Batch Streak Update] Completed. Success: ${processedUsers}, Errors: ${errors.length}`);
        return { processedUsers, errors };
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
                        timestamp: new Date(),
                    }],
                };
            }

            return { calls, errors: [] };
        } catch (error) {
            return {
                calls: [],
                errors: [{
                    userId,
                    error: `Error processing user calls: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date(),
                }],
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

        const existingCallIds = new Set(
            (await Call.find({
                callId: { $in: calls.map(c => c.call.id) },
            }).select('callId')).map(c => c.callId)
        );

        for (const { call, members } of calls) {
            try {
                if (existingCallIds.has(call.id)) continue;

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
                        const points = await this.calculatePoints(duration, isCreator);

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
                    timestamp: new Date(),
                });
            }
        }

        return { callsToCreate, streakUpdates, errors };
    }

    private static async updateStreaksBatch(updates: any[]): Promise<ProcessingError[]> {
        const errors: ProcessingError[] = [];
        const batchSize = 50;

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            await Promise.all(batch.map(async update => {
                try {
                    await this.updateUserStreakStats(update.userId);
                } catch (error) {
                    errors.push({
                        userId: update.userId,
                        error: `Failed to update streak: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        timestamp: new Date(),
                    });
                }
            }));
        }

        return errors;
    }

    static async syncStreaksWithStreamIO(): Promise<ProcessingSummary> {
        const startTime = Date.now();
        const summary: ProcessingSummary = {
            totalUsersProcessed: 0,
            totalCallsProcessed: 0,
            totalStreakUpdates: 0,
            errors: [],
            processingTime: 0,
        };

        try {
            console.log('[Sync] Starting StreamIO synchronization');
            const users = await User.find({}).select('_id').lean().exec();
            const batchSize = 10;

            for (let i = 0; i < users.length; i += batchSize) {
                const userBatch = users.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    userBatch.map(user => this.fetchAndProcessCalls(user._id.toString()))
                );

                const allCalls = batchResults.flatMap(result => result.calls);
                summary.errors.push(...batchResults.flatMap(result => result.errors));

                if (allCalls.length > 0) {
                    const { callsToCreate, streakUpdates, errors: processErrors } =
                        await this.processCallBatch(allCalls);

                    if (callsToCreate.length > 0) {
                        await Call.insertMany(callsToCreate, { ordered: false });
                        summary.totalCallsProcessed += callsToCreate.length;
                    }

                    if (streakUpdates.length > 0) {
                        const updateErrors = await this.updateStreaksBatch(streakUpdates);
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
            return summary;

        } catch (error) {
            console.error('[Sync] Critical error during synchronization:', error);
            throw error;
        }
    }

    static async getLeaderboard(limit = 10): Promise<Array<{
        userId: string;
        username: string;
        displayImage?: string;
        totalPoints: number;
        currentStreak: number;
        longestStreak: number;
        engagementScore: number;
        stats: IStreakStats;
    }>> {
        const streaks = await UserStreak.find()
            .sort({ totalPoints: -1 })
            .limit(limit)
            .populate('userId', 'username displayImage')
            .select('userId totalPoints currentStreak longestStreak stats')
            .lean();

        return streaks.map(streak => {
            const stats = streak.stats || {
                createdCalls: 0,
                participatedCalls: 0,
                totalCalls: 0,
                averageCallDuration: 0,
                totalCallDuration: 0,
                longestCallDuration: 0,
            };

            // Calculate engagement score with safe access
            const engagementScore = Math.round(
                ((streak.currentStreak || 0) * 10) +
                    ((stats.totalCalls || 0) * 5) +
                    ((streak.totalPoints || 0) * 0.1)
            );

            return {
                userId: (streak.userId as any)?._id?.toString() || '',
                username: (streak.userId as any)?.username || 'Unknown User',
                displayImage: (streak.userId as any)?.displayImage,
                totalPoints: streak.totalPoints || 0,
                currentStreak: streak.currentStreak || 0,
                longestStreak: streak.longestStreak || 0,
                stats,
                engagementScore,
            };
        }).filter(streak => streak.userId); // Filter out any invalid entries

    }
}