/* eslint-disable @typescript-eslint/no-explicit-any */
import { StreamClient, CallSettings } from '@stream-io/node-sdk';
import { STREAM_API_KEY, STREAM_API_SECRET } from '../utils/constants';
import { IUser } from '../models/Mongodb/user.model';
import { redisClient } from '../utils/redis';

interface CallMember {
    user_id: string;
    role?: string;
    custom?: Record<string, any>;
}

interface CallStats {
    totalCalls: number;
    ongoingCalls: number;
    completedCalls: number;
    upcomingCalls: number;
    callsByType: { [key: string]: number };
    callsByDate: { [key: string]: number };
}

interface PaginatedCallsResponse {
    stats: CallStats;
    calls: {
        all: any[];
        ongoing: any[];
        upcoming: any[];
        completed: any[];
    };
    pagination: {
        next?: string;
        hasMore: boolean;
        page: number;
        size: number;
        total: number;
    };
    error?: Error;
}

interface CallData {
    created_by_id: string;
    members?: CallMember[];
    custom?: Record<string, any>;
    settings_override?: CallSettings;
}

type FilterValue = {
    $eq?: any;
    $gt?: any;
    $gte?: any;
    $lt?: any;
    $lte?: any;
    $ne?: any;
    $in?: any[];
    $exists?: boolean;
};

interface FilterConditions {
    [key: string]: FilterValue | { [key: string]: FilterValue } | boolean | string | number;
}

export interface CallStatsReport {
    call_cid: string;
    call_session_id: string;
    first_stats_time: Date;
    call_status: string;
    quality_score?: number;
    created_at?: Date;
    call_duration_seconds: number;
}

export interface CallStatsAnalytics {
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    averageQualityScore: number;
    callsByStatus: {
        [key: string]: number;
    };
    callsByDuration: {
        short: number;   // < 5 minutes
        medium: number;  // 5-15 minutes
        long: number;    // > 15 minutes
    };
    qualityScoreRanges: {
        excellent: number;  // 90-100
        good: number;      // 70-89
        fair: number;      // 50-69
        poor: number;      // < 50
    };
    timeDistribution: {
        [key: string]: number; // Date string -> count
    };
}

export interface PaginatedCallStatsResponse {
    analytics: CallStatsAnalytics;
    reports: CallStatsReport[];
    pagination: {
        next?: string;
        prev?: string;
        hasMore: boolean;
        total: number;
    };
    duration: string;
    error?: Error;
}

export default class StreamIOConfig {
    private static client: StreamClient;

    static initialize(): void {
        if (!this.client) {
            this.client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET, { timeout: 30000 });
        }
    }

    static async createUser(user: IUser): Promise<{ message: string; error?: Error }> {
        try {
            this.initialize();
            const response = await this.client.upsertUsers([
                {
                    id: user.id,
                    name: user.username,
                    image: user.displayImage,
                    custom: {
                        walletAddress: user.walletAddress,
                    },
                },
            ]);

            console.log('Streamio User created successfully:', response);
            return { message: 'User created successfully' };
        } catch (error) {
            console.error('Error creating user:', error);
            return { message: 'Error creating user', error: error as Error };
        }
    }

    static async generateToken(userId: string): Promise<string> {
        const validity = 24 * 60 * 60;

        this.initialize();
        // // validity is optional, in this case we set it to 1 day
        // return this.client.generateUserToken({ user_id: userId, validity_in_seconds: validity });
        const newToken = this.client.generateUserToken({ user_id: userId, validity_in_seconds: validity });
        await redisClient.set(`stream_token_${userId}`, newToken);

        return newToken;
    }

    static async updateUser(user: IUser): Promise<{ message: string; error?: Error }> {
        try {
            this.initialize();
            const response = await this.client.updateUsersPartial({
                users: [
                    {
                        id: user.id,
                        set: {
                            name: user.username,
                            // image: user.displayImage,
                        },

                    },
                ],
            });

            console.log('Streamio User updated successfully:', response);

            return { message: 'User updated successfully' };
        } catch (error) {
            console.error('Error updating user:', error);
            return { message: 'Error updating user', error: error as Error };
        }
    }

    static async createCall(callType: string, callId: string, data: CallData, ring: boolean = false): Promise<{ call: any; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);

            // Ensure we have default settings for required fields
            const defaultSettings: Partial<CallSettings> = {
                audio: {
                    mic_default_on: true,
                    default_device: 'speaker',
                    access_request_enabled: false,
                    opus_dtx_enabled: false,
                    redundant_coding_enabled: false,
                    speaker_default_on: false,
                },
                video: {
                    camera_default_on: true,
                    access_request_enabled: false,
                    camera_facing: 'front',
                    enabled: false,
                    target_resolution: {
                        width: 640,
                        height: 480,
                        bitrate: 512,
                    },
                },
                backstage: {
                    enabled: false,
                },
            };

            const callRequest = {
                ring,
                data: {
                    ...data,
                    members: data.members || [{ user_id: data.created_by_id }],
                    settings_override: {
                        ...defaultSettings,
                        ...data.settings_override,
                        recording: data.settings_override?.recording
                            ? {
                                ...data.settings_override.recording,
                                mode: data.settings_override.recording.mode as 'available' | 'disabled' | 'auto-on',
                                quality: data.settings_override.recording.quality as '360p' | '480p' | '720p' | '1080p' | '1440p' | 'portrait-360x640' | 'portrait-480x854' | 'portrait-720x1280' | 'portrait-1080x1920' | 'portrait-1440x2560' | undefined,
                            }
                            : undefined,
                    },
                },
            };

            await call.create(callRequest);
            return { call };
        } catch (error) {
            console.error('Error creating call:', error);
            return { call: null, error: error as Error };
        }
    }

    // Update the getOrCreateCall method
    static async getOrCreateCall(callType: string, callId: string, data: CallData): Promise<{ call: any; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);

            const defaultSettings: Partial<CallSettings> = {
                audio: {
                    mic_default_on: true,
                    default_device: 'speaker',
                    access_request_enabled: false,
                    opus_dtx_enabled: false,
                    redundant_coding_enabled: false,
                    speaker_default_on: false,
                },
                video: {
                    camera_default_on: true,
                    access_request_enabled: false,
                    camera_facing: 'front',
                    enabled: false,
                    target_resolution: {
                        width: 640,
                        height: 480,
                        bitrate: 512,
                    },
                },
                backstage: {
                    enabled: false,
                },
            };

            const callRequest = {
                data: {
                    ...data,
                    members: data.members || [{ user_id: data.created_by_id }],
                    settings_override: {
                        ...defaultSettings,
                        ...data.settings_override,
                        recording: data.settings_override?.recording
                            ? {
                                ...data.settings_override.recording,
                                mode: data.settings_override.recording.mode as 'available' | 'disabled' | 'auto-on',
                                quality: data.settings_override.recording.quality as '360p' | '480p' | '720p' | '1080p' | '1440p' | 'portrait-360x640' | 'portrait-480x854' | 'portrait-720x1280' | 'portrait-1080x1920' | 'portrait-1440x2560' | undefined,
                            }
                            : undefined,
                    },
                },
            };

            const response = await call.getOrCreate(callRequest);
            return { call: response };
        } catch (error) {
            console.error('Error getting/creating call:', error);
            return { call: null, error: error as Error };
        }
    }

    // Update the updateCallSettings method
    static async updateCallSettings(callType: string, callId: string, settings: Partial<CallSettings>): Promise<{ success: boolean; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);

            // Ensure backstage is properly formatted if it's being updated
            const formattedSettings = {
                ...settings,
                backstage: settings.backstage
                    ? { enabled: settings.backstage.enabled }
                    : undefined,
                recording: settings.recording
                    ? {
                        ...settings.recording,
                        mode: settings.recording.mode as 'available' | 'disabled' | 'auto-on',
                        quality: settings.recording.quality as '360p' | '480p' | '720p' | '1080p' | '1440p' | 'portrait-360x640' | 'portrait-480x854' | 'portrait-720x1280' | 'portrait-1080x1920' | 'portrait-1440x2560' | undefined,
                    }
                    : undefined,
            };

            await call.update({
                settings_override: formattedSettings,
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating call settings:', error);
            return { success: false, error: error as Error };
        }
    }

    static async updateCallMembers(callType: string, callId: string, updateMembers: CallMember[], removeMembers?: string[]): Promise<{ success: boolean; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);
            await call.updateCallMembers({
                update_members: updateMembers,
                remove_members: removeMembers,
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating call members:', error);
            return { success: false, error: error as Error };
        }
    }

    static async endCall(callType: string, callId: string): Promise<{ success: boolean; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);
            await call.end();
            return { success: true };
        } catch (error) {
            console.error('Error ending call:', error);
            return { success: false, error: error as Error };
        }
    }

    static async queryCallMembers(callType: string, callId: string, options: {
        filter_conditions?: FilterConditions;
        sort?: Array<{ field: string; direction: 1 | -1 }>;
        limit?: number;
        next?: string;
    }): Promise<{ members: any[]; next?: string; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);
            const response = await call.queryMembers(options); // Removed payload wrapper
            return {
                members: response.members,
                next: response.next,
            };
        } catch (error) {
            console.error('Error querying call members:', error);
            return { members: [], error: error as Error };
        }
    }

    static async pinParticipant(callType: string, callId: string, sessionId: string, userId: string): Promise<{ success: boolean; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);
            await call.videoPin({
                session_id: sessionId,
                user_id: userId,
            });
            return { success: true };
        } catch (error) {
            console.error('Error pinning participant:', error);
            return { success: false, error: error as Error };
        }
    }

    static async unpinParticipant(callType: string, callId: string, sessionId: string, userId: string): Promise<{ success: boolean; error?: Error }> {
        try {
            this.initialize();
            const call = this.client.video.call(callType, callId);
            await call.videoUnpin({
                session_id: sessionId,
                user_id: userId,
            });
            return { success: true };
        } catch (error) {
            console.error('Error unpinning participant:', error);
            return { success: false, error: error as Error };
        }
    }

    static async getCallStats(
        startDate?: Date,
        endDate?: Date,
        page: number = 1,
        size: number = 100,
        nextToken?: string
    ): Promise<PaginatedCallsResponse> {
        try {
            this.initialize();

            // Get all calls with basic date filtering
            const baseFilter: FilterConditions = {};
            if (startDate) {
                baseFilter.created_at = { $gte: startDate.toISOString() };
            } else if (endDate) {
                baseFilter.created_at = { $lte: endDate.toISOString() };
            }

            // Get all calls with pagination
            const allCallsResponse = await this.client.video.queryCalls({
                filter_conditions: baseFilter,
                limit: size,
                next: nextToken,
                sort: [{ field: 'created_at', direction: -1 }], // Sort by creation date, newest first
            });

            const { calls: allCalls, next: allCallsNext } = allCallsResponse;

            // Get ongoing calls
            const ongoingCallsResponse = await this.client.video.queryCalls({
                filter_conditions: { ongoing: true },
                limit: size,
                next: nextToken,
                sort: [{ field: 'created_at', direction: -1 }],
            });

            // Get upcoming calls
            const now = new Date().toISOString();
            const upcomingCallsResponse = await this.client.video.queryCalls({
                filter_conditions: {
                    starts_at: { $gt: now },
                    ended_at: null,
                },
                limit: size,
                next: nextToken,
                sort: [{ field: 'starts_at', direction: 1 }],
            });

            // Get completed calls
            const completedCallsResponse = await this.client.video.queryCalls({
                filter_conditions: {
                    ended_at: { $exists: true },
                },
                limit: size,
                next: nextToken,
                sort: [{ field: 'ended_at', direction: -1 }],
            });

            // Aggregate calls by type and date
            const callsByType: { [key: string]: number } = {};
            const callsByDate: { [key: string]: number } = {};

            allCalls.forEach((callData) => {
                // Safely access nested call data
                const call = callData.call;
                if (!call) return;

                // Aggregate by type
                const type = call.custom?.type || call.type || 'unknown';
                callsByType[type] = (callsByType[type] || 0) + 1;

                // Aggregate by date
                if (call.created_at) {
                    try {
                        const date = new Date(call.created_at).toISOString().split('T')[0];
                        callsByDate[date] = (callsByDate[date] || 0) + 1;
                    } catch (e) {
                        console.warn('Invalid date found:', call.created_at);
                        console.log(e);
                    }
                }
            });

            // Filter the results based on date range if provided
            const filterByDateRange = (calls: any[]) => {
                return calls.filter(callData => {
                    if (!callData.call?.created_at) return false;
                    try {
                        const callDate = new Date(callData.call.created_at);
                        const isAfterStart = !startDate || callDate >= startDate;
                        const isBeforeEnd = !endDate || callDate <= endDate;
                        return isAfterStart && isBeforeEnd;
                    } catch (e) {
                        console.warn('Invalid date during filtering:', callData.call.created_at);
                        console.log(e);
                        return false;
                    }
                });
            };

            // Apply date filtering to the results
            const filteredOngoingCalls = filterByDateRange(ongoingCallsResponse.calls);
            const filteredUpcomingCalls = filterByDateRange(upcomingCallsResponse.calls);
            const filteredCompletedCalls = filterByDateRange(completedCallsResponse.calls);

            return {
                stats: {
                    totalCalls: allCalls.length,
                    ongoingCalls: filteredOngoingCalls.length,
                    completedCalls: filteredCompletedCalls.length,
                    upcomingCalls: filteredUpcomingCalls.length,
                    callsByType,
                    callsByDate,
                },
                calls: {
                    all: allCalls,
                    ongoing: filteredOngoingCalls,
                    upcoming: filteredUpcomingCalls,
                    completed: filteredCompletedCalls,
                },
                pagination: {
                    next: allCallsNext,
                    hasMore: Boolean(allCallsNext),
                    page,
                    size,
                    total: allCalls.length,
                },
            };
        } catch (error) {
            console.error('Error fetching call stats:', error);
            return {
                stats: {
                    totalCalls: 0,
                    ongoingCalls: 0,
                    completedCalls: 0,
                    upcomingCalls: 0,
                    callsByType: {},
                    callsByDate: {},
                },
                calls: {
                    all: [],
                    ongoing: [],
                    upcoming: [],
                    completed: [],
                },
                pagination: {
                    hasMore: false,
                    page,
                    size,
                    total: 0,
                },
                error: error as Error,
            };
        }
    }

    static async getCallsByUser(userId: string): Promise<{ calls: any[]; error?: Error }> {
        try {
            this.initialize();
            const { calls } = await this.client.video.queryCalls({
                filter_conditions: {
                    $or: [
                        { created_by_user_id: userId },
                        { members: { $in: [userId] } },
                    ],
                },
                limit: 100,
            });
            return { calls };
        } catch (error) {
            console.error('Error fetching user calls:', error);
            return { calls: [], error: error as Error };
        }
    }

    static async getCallDetails(callId: string): Promise<{ call: any; error?: Error }> {
        try {
            this.initialize();
            const { calls } = await this.client.video.queryCalls({
                filter_conditions: { id: callId },
            });
            return { call: calls[0] };
        } catch (error) {
            console.error('Error fetching call details:', error);
            return { call: null, error: error as Error };
        }
    }

    static async getDetailedCallStats(
        startDate?: Date,
        endDate?: Date,
        size: number = 1000,
        nextToken?: string
    ): Promise<PaginatedCallStatsResponse> {
        try {
            this.initialize();

            // Prepare filter conditions
            const filterConditions: Record<string, any> = {};
            if (startDate) {
                filterConditions.created_at = { $gte: startDate.toISOString() };
            }
            if (endDate) {
                filterConditions.created_at = filterConditions.created_at || {};
                filterConditions.created_at.$lte = endDate.toISOString();
            }

            // Query call stats
            const response = await this.client.video.queryCallStats({
                filter_conditions: filterConditions,
                limit: size,
                next: nextToken,
                sort: [{ field: 'created_at', direction: -1 }],
            });

            // Transform reports data
            const reports = response.reports.map(report => ({
                ...report,
                first_stats_time: new Date(report.first_stats_time),
                created_at: report.created_at ? new Date(report.created_at) : undefined,
            }));

            // Calculate analytics
            const analytics = this.calculateCallStatsAnalytics(reports);

            return {
                analytics,
                reports,
                pagination: {
                    next: response.next,
                    prev: response.prev,
                    hasMore: Boolean(response.next),
                    total: reports.length,
                },
                duration: response.duration,
            };
        } catch (error) {
            console.error('Error fetching detailed call stats:', error);
            return {
                analytics: {
                    totalCalls: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    averageQualityScore: 0,
                    callsByStatus: {},
                    callsByDuration: { short: 0, medium: 0, long: 0 },
                    qualityScoreRanges: { excellent: 0, good: 0, fair: 0, poor: 0 },
                    timeDistribution: {},
                },
                reports: [],
                pagination: {
                    hasMore: false,
                    total: 0,
                },
                duration: '0ms',
                error: error as Error,
            };
        }
    }

    private static calculateCallStatsAnalytics(reports: CallStatsReport[]): CallStatsAnalytics {
        const analytics: CallStatsAnalytics = {
            totalCalls: reports.length,
            totalDuration: 0,
            averageDuration: 0,
            averageQualityScore: 0,
            callsByStatus: {},
            callsByDuration: {
                short: 0,   // < 5 minutes
                medium: 0,  // 5-15 minutes
                long: 0,     // > 15 minutes
            },
            qualityScoreRanges: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
            },
            timeDistribution: {},
        };

        let totalQualityScore = 0;
        let qualityScoreCount = 0;

        reports.forEach(report => {
            // Calculate durations
            analytics.totalDuration += report.call_duration_seconds;

            // Categorize by duration
            const durationMinutes = report.call_duration_seconds / 60;
            if (durationMinutes < 5) {
                analytics.callsByDuration.short++;
            } else if (durationMinutes <= 15) {
                analytics.callsByDuration.medium++;
            } else {
                analytics.callsByDuration.long++;
            }

            // Count by status
            analytics.callsByStatus[report.call_status] =
                (analytics.callsByStatus[report.call_status] || 0) + 1;

            // Quality score ranges
            if (report.quality_score !== undefined) {
                totalQualityScore += report.quality_score;
                qualityScoreCount++;

                if (report.quality_score >= 90) {
                    analytics.qualityScoreRanges.excellent++;
                } else if (report.quality_score >= 70) {
                    analytics.qualityScoreRanges.good++;
                } else if (report.quality_score >= 50) {
                    analytics.qualityScoreRanges.fair++;
                } else {
                    analytics.qualityScoreRanges.poor++;
                }
            }

            // Time distribution
            if (report.created_at) {
                const dateKey = report.created_at.toISOString().split('T')[0];
                analytics.timeDistribution[dateKey] =
                    (analytics.timeDistribution[dateKey] || 0) + 1;
            }
        });

        // Calculate averages
        analytics.averageDuration = analytics.totalDuration / Math.max(reports.length, 1);
        analytics.averageQualityScore = totalQualityScore / Math.max(qualityScoreCount, 1);

        return analytics;
    }
}