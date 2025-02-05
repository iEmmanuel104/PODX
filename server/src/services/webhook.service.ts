/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserStreak, ICallActivity } from '../models/Mongodb/userStreak.model';
import { webhookConfig } from '../clients/webhook.config';
import StreamIOConfig from '../clients/streamio.config';
import { Call } from '../models/Mongodb/call.model';

interface UserResponse {
    id: string;
    name?: string;
    image?: string;
    banned: boolean;
    online: boolean;
    role: string;
    language: string;
    teams: string[];
    blocked_user_ids: string[];
    created_at: number;
    updated_at: number;
    last_active?: number;
    deactivated_at?: number;
    deleted_at?: number;
    revoke_tokens_issued_before?: number;
    custom: Record<string, unknown>;
}

interface CallParticipant {
    user: UserResponse;
    role: string;
    user_session_id: string;
    joined_at: number;
}

interface CallCreatedEvent {
    call: CallResponse;
    call_cid: string;
    created_at: number;
    members: MemberResponse[];
    type: string;
}

interface CallResponse {
    id: string;
    type: string;
    created_at: number;
    created_by: UserResponse;
    current_session_id?: string;
    ended_at?: number;
    custom?: Record<string, unknown>;
    cid: string;
}

interface MemberResponse {
    user: UserResponse;
    user_id: string;
    role?: string;
    created_at: number;
    custom?: Record<string, unknown>;
}

interface CallSessionPayload {
    call: {
        type: string;
        id: string;
        current_session_id?: string;
        session?: {
            participants: CallParticipant[];
        };
    };
    session_id: string;
    participant: CallParticipant;
    created_at: string;
}

interface CallSessionEndPayload {
    call_cid: string;
    participant: CallParticipant;
    duration_seconds: number;
    created_at: string;
}

export class WebhookService {
    static async calculatePoints(duration: number, isCreator: boolean): Promise<number> {
        const { POINTS_CONFIG } = webhookConfig;
        let points = Math.floor(duration / 60) * POINTS_CONFIG.POINTS_PER_MINUTE;

        if (isCreator) {
            points = Math.floor(points * POINTS_CONFIG.CREATOR_BONUS_MULTIPLIER);
            points += POINTS_CONFIG.CALL_CREATION;
        }

        // Apply duration-based bonuses
        for (const threshold of POINTS_CONFIG.BONUS_THRESHOLDS) {
            if (duration >= threshold.duration) {
                points += threshold.points;
            }
        }

        return points;
    }

    static async updateStreak(userId: string, activityDate: Date): Promise<void> {
        let userStreak = await UserStreak.findOne({ userId });

        if (!userStreak) {
            userStreak = new UserStreak({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: activityDate,
                streakHistory: [{ date: activityDate, streak: 1 }],
            });
        } else {
            const lastDate = new Date(userStreak.lastActivityDate);
            const daysDiff = Math.floor(
                (activityDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff > webhookConfig.STREAK_CONFIG.BREAK_AFTER_DAYS) {
                userStreak.currentStreak = 1;
            } else if (daysDiff === 1) {
                userStreak.currentStreak += 1;
                if (userStreak.currentStreak > userStreak.longestStreak) {
                    userStreak.longestStreak = userStreak.currentStreak;
                }
            }

            // Apply streak multipliers to points
            const { BONUS_MULTIPLIERS } = webhookConfig.STREAK_CONFIG;
            for (const bonus of BONUS_MULTIPLIERS) {
                if (userStreak.currentStreak >= bonus.days) {
                    userStreak.totalPoints = Math.floor(userStreak.totalPoints * bonus.multiplier);
                    break;
                }
            }

            userStreak.lastActivityDate = activityDate;
            userStreak.streakHistory.push({
                date: activityDate,
                streak: userStreak.currentStreak,
            });
        }

        await userStreak.save();
    }

    static async handleCallSessionStart(payload: CallSessionPayload): Promise<void> {
        const { call, session_id, participant } = payload;

        // Initialize StreamIOConfig
        StreamIOConfig.initialize();

        const customData = {
            join_time: new Date().toISOString(),
            session_id,
        };

        try {
            await StreamIOConfig.updateCallMembers(
                call.type,
                call.id,
                [{
                    user_id: participant.user.id,
                    custom: customData,
                }]
            );
        } catch (error) {
            console.error('Error updating call members:', error);
            throw error;
        }
    }

    static async handleCallSessionEnd(payload: CallSessionEndPayload): Promise<void> {
        const {
            call_cid,
            participant,
            duration_seconds,
            created_at,
        } = payload;

        if (duration_seconds < webhookConfig.STREAK_CONFIG.MIN_CALL_DURATION) {
            return;
        }

        const userId = participant.user.id;
        const [, callId] = call_cid.split(':');
        const callDetails = await StreamIOConfig.getCallDetails(callId);
        const isCreator = callDetails.call?.created_by?.id === userId;
        const points = await this.calculatePoints(duration_seconds, isCreator);

        const callActivity: ICallActivity = {
            date: new Date(created_at),
            callId: call_cid,
            duration: duration_seconds,
            isCreator,
            points,
        };

        // Update user streak and points
        const userStreak = await UserStreak.findOne({ userId });
        if (userStreak) {
            userStreak.callActivities.push(callActivity);
            userStreak.totalPoints += points;
            await userStreak.save();
        } else {
            await UserStreak.create({
                userId,
                callActivities: [callActivity],
                totalPoints: points,
                lastActivityDate: new Date(created_at),
            });
        }

        await this.updateStreak(userId, new Date(created_at));
    }

    static async handleCallCreated(payload: CallCreatedEvent): Promise<void> {
        const { call, members, created_at } = payload;
        try {
            // Create new call record
            await Call.create({
                callId: call.id,
                type: call.type,
                createdById: call.created_by.id,
                status: 'created',
                members: members.map(member => ({
                    userId: member.user.id,
                    role: member.role,
                })),
                startTime: new Date(created_at),
                custom: call.custom,
            });

            // Award points for call creation and update streak
            const userId = call.created_by.id;
            const points = webhookConfig.POINTS_CONFIG.CALL_CREATION;

            const callActivity: ICallActivity = {
                date: new Date(created_at),
                callId: call.cid,
                duration: 0,
                isCreator: true,
                points,
            };

            // Update user streak and points
            const userStreak = await UserStreak.findOne({ userId });
            if (userStreak) {
                userStreak.callActivities.push(callActivity);
                userStreak.totalPoints += points;
                await userStreak.save();
            } else {
                await UserStreak.create({
                    userId,
                    callActivities: [callActivity],
                    totalPoints: points,
                    lastActivityDate: new Date(created_at),
                });
            }

            await this.updateStreak(userId, new Date(created_at));
        } catch (error) {
            console.error('Error handling call creation:', error);
            throw error;
        }
    }

    static async handleCallEnded(payload: {
        call: CallSessionPayload['call'];
        created_at: string;
    }): Promise<void> {
        const { call, created_at } = payload;
        if (!call.current_session_id) return;

        // Update call status in database
        await Call.findOneAndUpdate(
            { callId: call.id },
            {
                status: 'ended',
                endTime: new Date(created_at),
                $set: {
                    'custom.ended_at': created_at,
                },
            }
        );

        const participants = call.session?.participants || [];
        for (const participant of participants) {
            const duration = participant.joined_at ?
                Math.floor((new Date(created_at).getTime() - participant.joined_at) / 1000) : 0;

            await this.handleCallSessionEnd({
                call_cid: `${call.type}:${call.id}`,
                participant,
                duration_seconds: duration,
                created_at,
            });
        }
    }

    static async handleLiveStarted(payload: CallSessionPayload): Promise<void> {
        const { call } = payload;
        if (!call.current_session_id) return;

        const participants = call.session?.participants || [];
        for (const participant of participants) {
            await this.handleCallSessionStart({
                call,
                session_id: call.current_session_id,
                participant,
                created_at: new Date().toISOString(),
            });
        }
    }

    static async processWebhook(eventType: string, payload: unknown): Promise<void> {
        try {
            switch (eventType) {
            case 'call.created':
                await this.handleCallCreated(payload as CallCreatedEvent);
                break;
            case 'call.session_participant_left':
                await this.handleCallSessionEnd(payload as CallSessionEndPayload);
                break;
            case 'call.session_participant_joined':
                await this.handleCallSessionStart(payload as CallSessionPayload);
                break;
            case 'call.ended':
                await this.handleCallEnded(payload as { call: CallSessionPayload['call']; created_at: string });
                break;
            case 'call.live_started':
                await this.handleLiveStarted(payload as CallSessionPayload);
                break;
            }
        } catch (error) {
            console.error(`Error processing webhook event ${eventType}:`, error);
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
    }>> {
        const streaks = await UserStreak.find()
            .sort({ totalPoints: -1 })
            .limit(limit)
            .populate('userId', 'username displayImage')
            .select('userId totalPoints currentStreak longestStreak')
            .lean();

        return streaks.map(streak => ({
            userId: (streak.userId as any)?._id?.toString() || '',
            username: (streak.userId as any)?.username || 'Unknown User',
            displayImage: (streak.userId as any)?.displayImage,
            totalPoints: streak.totalPoints,
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
        }));
    }
}