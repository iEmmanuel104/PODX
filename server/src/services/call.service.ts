import { Call } from '../models/Mongodb/call.model';
import { StreakService } from './streak.service';
import StreamIOConfig from '../clients/streamio.config';
import { webhookConfig } from '../clients/webhook.config';
import { CallSessionPayload, CallSessionEndPayload, CallCreatedEvent } from '../utils/interface';

export class CallService {
    static async handleCallSessionStart(payload: CallSessionPayload): Promise<void> {
        const { call, session_id, participant } = payload;

        StreamIOConfig.initialize();

        try {
            await StreamIOConfig.updateCallMembers(
                call.type,
                call.id,
                [{
                    user_id: participant.user.id,
                    custom: {
                        join_time: new Date().toISOString(),
                        session_id,
                    },
                }]
            );
        } catch (error) {
            console.error('Error updating call members:', error);
            throw error;
        }
    }

    static async handleCallSessionEnd(payload: CallSessionEndPayload): Promise<void> {
        const { call_cid, participant, duration_seconds } = payload;

        if (duration_seconds < webhookConfig.STREAK_CONFIG.MIN_CALL_DURATION) {
            return;
        }

        const userId = participant.user.id;
        const [, callId] = call_cid.split(':');

        // Update call duration
        await Call.findOneAndUpdate(
            { callId },
            { duration: duration_seconds }
        );

        // Update streak stats
        await StreakService.updateUserStreakStats(userId);
    }

    static async handleCallCreated(payload: CallCreatedEvent): Promise<void> {
        const { call, members, created_at } = payload;

        try {
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

            // Update streak for creator
            await StreakService.updateUserStreakStats(call.created_by.id);
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

        await Call.findOneAndUpdate(
            { callId: call.id },
            {
                status: 'ended',
                endTime: new Date(created_at),
                $set: { 'custom.ended_at': created_at },
            }
        );

        // Update streaks for all participants
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
                await this.handleCallEnded(payload as {
                        call: CallSessionPayload['call'];
                        created_at: string
                    });
                break;
            case 'call.live_started':
                // Handle live started event if needed
                break;
            }
        } catch (error) {
            console.error(`Error processing webhook event ${eventType}:`, error);
            throw error;
        }
    }
}