// controllers/calls.controller.ts
import { Response } from 'express';
import { redisClient } from '../utils/redis';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from 'middlewares/authMiddleware';

export default class CallsController {
    static async scheduleCall(req: AuthenticatedRequest, res: Response) {
        const { title, type, sessionId, starts_at } = req.body;

        const startTime = new Date(starts_at);
        const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000);
        const now = new Date();

        if (startTime < now) {
            throw new BadRequestError('Cannot schedule calls in the past');
        }

        const callData = {
            id: sessionId,
            custom: {
                title,
                type,
                sessionId,
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

        res.status(200).json({
            status: 'success',
            message: 'Call scheduled successfully',
            data: callData,
        });
    }

    static async getScheduledCall(req: AuthenticatedRequest, res: Response) {
        const { sessionId } = req.params;
        const callKey = `scheduled_call:${sessionId}`;

        const callData = await redisClient.get(callKey);

        if (!callData) {
            throw new BadRequestError('Scheduled call not found');
        }

        const parsedCallData = JSON.parse(callData);

        // Check if the current user has joined this session
        const userJoinedKey = `session_participants:${sessionId}`;
        const participants = await redisClient.smembers(userJoinedKey);
        const hasJoined = participants.includes(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Scheduled call retrieved successfully',
            data: {
                call: parsedCallData,
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
}