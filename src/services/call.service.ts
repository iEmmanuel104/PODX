import { Call } from '../models/Mongodb/call.model';
import { StreakService } from './streak.service';
import StreamIOConfig from '../clients/streamio.config';
import { webhookConfig } from '../clients/webhook.config';
import { CallSessionPayload, CallSessionEndPayload, CallCreatedEvent, CustomEventPayload } from '../utils/interface';
import { TipService } from './tip.service';
import { POAPService } from './poap.service';
import { logger } from '../utils/logger';

export class CallService {
    static async handleCallSessionStart(payload: CallSessionPayload): Promise<void> {
        const { call_cid, session_id, participant } = payload;
        console.log({ sessionCreatedPayload: payload });

        try {
            if (!call_cid) {
                throw new Error('call_cid is required');
            }
            const [type, id] = call_cid.split(':');

            // Update StreamIO
            await StreamIOConfig.updateCallMembers(
                type,
                id,
                [{
                    user_id: participant.user.id,
                    custom: {
                        join_time: new Date().toISOString(),
                        session_id,
                    },
                }]
            );

            // Update local database and track join event
            await Call.findOneAndUpdate(
                {
                    callId: id,
                    // Check if this user is not already in the members array
                    'members.userId': { $ne: participant.user.id },
                },
                {
                    // Only add to members array if user doesn't exist
                    $addToSet: {
                        members: {
                            userId: participant.user.id,
                            role: participant.role,
                        },
                    },
                    $push: {
                        'custom.events': {
                            userId: participant.user.id,
                            type: 'joined',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    $set: {
                        sessionId: session_id,
                        status: 'live',
                    },
                },
                { new: true }
            );

        } catch (error) {
            console.error('Error updating call members:', error);
            throw error;
        }
    }

    static async handleCallSessionEnd(payload: CallSessionEndPayload): Promise<void> {
        const { call_cid, participant, duration_seconds } = payload;

        console.log({ sessionEndPayload: payload });

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

        console.log({ sessionCreatedPayload: payload });

        try {
            // Set default duration requirement if not provided
            const custom = {
                ...call.custom,
                durationRequirement: {
                    value: call.custom?.durationRequirement?.value || 1,
                    type: call.custom?.durationRequirement?.type || 'absolute'
                },
                // Preserve metadata if it exists
                metadata: call.custom?.metadata || undefined
            };

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
                custom,
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

        console.log({ handleEndedPayload: payload });
        if (!call?.current_session_id) return;

        // Update call status
        await Call.findOneAndUpdate(
            { callId: call?.id },
            {
                status: 'ended',
                endTime: new Date(created_at),
                $set: {
                    'custom.ended_at': created_at,
                    'custom.events': call.session?.participants.map(participant => ({
                        userId: participant.user.id,
                        type: 'left',
                        timestamp: created_at,
                    })),
                },
            }
        );

        // Update streaks for all participants
        const participants = call?.session?.participants || [];
        for (const participant of participants) {
            const duration = participant.joined_at ?
                Math.floor((new Date(created_at).getTime() - participant.joined_at) / 1000) : 0;

            await this.handleCallSessionEnd({
                call_cid: `${call?.type}:${call?.id}`,
                participant,
                duration_seconds: duration,
                created_at,
            });
        }

        // Handle POAP minting after call ends
        try {
            await POAPService.handleCallPOAP(call.id);
            logger.info(`POAP distribution initiated for call ${call.id}`);
        } catch (error) {
            logger.error('Error handling POAP for call:', error);
            // Don't throw the error here to prevent disrupting the main call end flow
        }
    }

    static async handleCustomEvent(payload: CustomEventPayload): Promise<void> {
        if (payload.custom.type !== 'tip') return;

        const [, callId] = payload.call_cid.split(':');
        const tipData = payload.custom;

        try {
            const call = await Call.findOne({ callId });
            if (!call) {
                throw new Error('Call not found');
            }

            await TipService.createTip(
                callId,
                call.sessionId,
                tipData.from.id as string,
                tipData.to.id as string,
                tipData.amount as string,
                tipData.currency as string,
                tipData.timestamp,
                tipData.transactionHash
            );

        } catch (error) {
            console.error('Error handling tip event:', error);
            throw error;
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
            case 'custom':
                await this.handleCustomEvent(payload as CustomEventPayload);
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