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

export default class StreamIOConfig {
    private static client: StreamClient;

    static initialize(): void {
        if (!this.client) {
            this.client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
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

    static async getCallStats(startDate?: Date, endDate?: Date): Promise<{ stats: CallStats; error?: Error }> {
        try {
            this.initialize();
            const dateFilter: FilterConditions = {};

            if (startDate) {
                dateFilter.created_at = { $gte: startDate.toISOString() };
            }
            if (endDate) {
                dateFilter.created_at = {
                    ...(dateFilter.created_at as object || {}),
                    $lte: endDate.toISOString(),
                };
            }

            const { calls: allCalls } = await this.client.video.queryCalls({
                filter_conditions: dateFilter,
                limit: 1000,
            });

            // Get ongoing calls
            const { calls: ongoingCalls } = await this.client.video.queryCalls({
                filter_conditions: {
                    ...dateFilter,
                    ongoing: { $eq: true },
                } as FilterConditions,
            });

            // Get upcoming calls (next 24 hours)
            const inNext24Hours = new Date(Date.now() + 1000 * 60 * 60 * 24);
            const { calls: upcomingCalls } = await this.client.video.queryCalls({
                filter_conditions: {
                    ...dateFilter,
                    starts_at: { $gt: new Date().toISOString(), $lt: inNext24Hours.toISOString() },
                } as FilterConditions,
            });

            // Get completed calls
            const { calls: completedCalls } = await this.client.video.queryCalls({
                filter_conditions: {
                    ...dateFilter,
                    ended_at: { $exists: true },
                } as FilterConditions,
            });

            // Aggregate calls by type and date
            const callsByType: { [key: string]: number } = {};
            const callsByDate: { [key: string]: number } = {};

            allCalls.forEach((call) => {
                // Safe type casting for call object
                const callData = call as any;

                // Aggregate by type
                const type = callData.type || 'unknown';
                callsByType[type] = (callsByType[type] || 0) + 1;

                // Aggregate by date
                const date = new Date(callData.created_at).toISOString().split('T')[0];
                callsByDate[date] = (callsByDate[date] || 0) + 1;
            });

            return {
                stats: {
                    totalCalls: allCalls.length,
                    ongoingCalls: ongoingCalls.length,
                    completedCalls: completedCalls.length,
                    upcomingCalls: upcomingCalls.length,
                    callsByType,
                    callsByDate,
                },
            };
        } catch (error) {
            console.error('Error fetching call stats:', error);
            throw error; // Let the caller handle the error
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
}