import crypto from 'crypto';
import { STREAM_API_SECRET } from '../utils/constants';

export interface WebhookConfig {
    WEBHOOK_SECRET: string;
    POINTS_CONFIG: {
        CALL_CREATION: number;
        POINTS_PER_MINUTE: number;
        CREATOR_BONUS_MULTIPLIER: number;
        BONUS_THRESHOLDS: {
            duration: number;
            points: number;
        }[];
    };
    STREAK_CONFIG: {
        BREAK_AFTER_DAYS: number;
        MIN_CALL_DURATION: number;
        BONUS_MULTIPLIERS: {
            days: number;
            multiplier: number;
        }[];
    };
    RELEVANT_EVENTS: string[];
}

export const webhookConfig: WebhookConfig = {
    WEBHOOK_SECRET: STREAM_API_SECRET,
    POINTS_CONFIG: {
        CALL_CREATION: 10,
        POINTS_PER_MINUTE: 1,
        CREATOR_BONUS_MULTIPLIER: 1.5,
        BONUS_THRESHOLDS: [
            { duration: 3600, points: 50 },  // 1 hour bonus
            { duration: 7200, points: 150 }, // 2 hour bonus
            { duration: 14400, points: 300 }, // 4 hour bonus
        ],
    },
    STREAK_CONFIG: {
        BREAK_AFTER_DAYS: 1,
        MIN_CALL_DURATION: 60, // 1 minute
        BONUS_MULTIPLIERS: [
            { days: 7, multiplier: 1.5 },   // Week streak
            { days: 30, multiplier: 2.0 },  // Month streak
            { days: 90, multiplier: 3.0 },   // Quarter streak
        ],
    },
    RELEVANT_EVENTS: [
        'call.created',
        'call.ended',
        'call.session_started',
        'call.session_ended',
        'call.session_participant_joined',
        'call.session_participant_left',
        'call.live_started',
        'custom',
    ],
};

export const verifyWebhookSignature = (
    signature: string,
    body: string,
    secret: string = webhookConfig.WEBHOOK_SECRET
): boolean => {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
};

export const isRelevantEvent = (eventType: string): boolean => {
    return webhookConfig.RELEVANT_EVENTS.includes(eventType);
};