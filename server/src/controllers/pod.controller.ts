import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import PodService from '../services/pod.service';
import { BadRequestError } from '../utils/customErrors';
import { PodType } from '../models/Mongodb/pod.model';

export default class PodController {
    static async createOrFindPod(req: AuthenticatedRequest, res: Response) {
        const { meetingId, type, startTime, endTime } = req.body;

        if (!meetingId || !type) {
            throw new BadRequestError('Meeting ID and type are required');
        }

        let pod = await PodService.findPod(meetingId, type);

        if (!pod) {
            pod = await PodService.createPod({
                owner: req.user.id,
                meetingId,
                type,
                startTime,
                endTime,
            });
        }

        res.status(200).json({
            status: 'success',
            message: pod ? 'Existing pod found' : 'New pod created',
            data: pod,
        });
    }

    static async joinPod(req: AuthenticatedRequest, res: Response) {
        const { podId } = req.params;

        const pod = await PodService.joinPod(podId, req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Successfully joined pod',
            data: pod,
        });
    }

    static async getUserPods(req: AuthenticatedRequest, res: Response) {
        const { status, type } = req.query;

        const pods = await PodService.getUserPods(req.user.id, {
            status: status as 'upcoming' | 'active' | 'ended',
            type: type as PodType,
        });

        res.status(200).json({
            status: 'success',
            message: 'User pods retrieved successfully',
            data: pods,
        });
    }

    static async getUserStreak(req: AuthenticatedRequest, res: Response) {
        const { type } = req.query;

        if (!type) {
            throw new BadRequestError('Pod type is required');
        }

        const streak = await PodService.calculateUserStreak(req.user.id, type as PodType);

        res.status(200).json({
            status: 'success',
            message: 'User streak retrieved successfully',
            data: { streak },
        });
    }
}