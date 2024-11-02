import { Types } from 'mongoose';
import { Pod, IPod } from '../models/Mongodb/pod.model';
import { User } from '../models/Mongodb/user.model';
import { redisClient } from '../utils/redis';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import { PodType } from '../models/Mongodb/pod.model';
import { v4 as uuidv4 } from 'uuid';

interface ICreatePodData {
    owner: string;
    meetingId: string;
    type: PodType;
    startTime?: Date;
    endTime?: Date;
}

interface IFindPodQuery {
    meetingId?: string;
    type?: PodType;
    userId?: string;
    status?: 'upcoming' | 'active' | 'ended';
}

export default class PodService {
    private static readonly POD_CHANNEL = 'pod_events';
    private static readonly STREAK_EXPIRE_TIME = 60 * 60 * 24 * 7; // 7 days in seconds

    static async createPod(data: ICreatePodData): Promise<IPod> {
        const { owner, meetingId, type, startTime, endTime } = data;

        // Create new pod
        const pod = await Pod.create({
            id: uuidv4(),
            owner: new Types.ObjectId(owner),
            meetingId,
            type,
            startTime,
            endTime,
            hosts: [new Types.ObjectId(owner)],
            stats: {
                memberCount: 1,
                hostCount: 1,
            },
        });

        // Update user's ownedPods
        await User.findByIdAndUpdate(owner, {
            $addToSet: { ownedPods: pod._id },
        });

        // Publish pod creation event to Redis
        await redisClient.publish(this.POD_CHANNEL, JSON.stringify({
            event: 'pod_created',
            data: {
                podId: pod.id,
                meetingId,
                type,
                owner,
            },
        }));

        // Track streak in Redis
        const streakKey = `streak:${type}:${meetingId}:${owner}`;
        await redisClient.setex(streakKey, this.STREAK_EXPIRE_TIME, '1');

        return pod;
    }

    static async findPod(meetingId: string, type: PodType): Promise<IPod | null> {
        return Pod.findOne({ meetingId, type });
    }

    static async joinPod(podId: string, userId: string): Promise<IPod> {
        const pod = await Pod.findById(podId);
        if (!pod) {
            throw new NotFoundError('Pod not found');
        }

        if (pod.members.includes(new Types.ObjectId(userId))) {
            throw new BadRequestError('User already in pod');
        }

        // Add user to pod members
        pod.members.push(new Types.ObjectId(userId));
        pod.stats.memberCount += 1;
        await pod.save();

        // Update user's memberPods
        await User.findByIdAndUpdate(userId, {
            $addToSet: { memberPods: pod._id },
        });

        // Track streak
        const streakKey = `streak:${pod.type}:${pod.meetingId}:${userId}`;
        await redisClient.setex(streakKey, this.STREAK_EXPIRE_TIME, '1');

        return pod;
    }

    static async getUserPods(userId: string, query: IFindPodQuery): Promise<IPod[]> {
        const now = new Date();
        let timeFilter = {};

        switch (query.status) {
        case 'upcoming':
            timeFilter = { startTime: { $gt: now } };
            break;
        case 'active':
            timeFilter = {
                startTime: { $lte: now },
                endTime: { $gt: now },
            };
            break;
        case 'ended':
            timeFilter = { endTime: { $lt: now } };
            break;
        }

        return Pod.find({
            $or: [
                { owner: new Types.ObjectId(userId) },
                { members: new Types.ObjectId(userId) },
            ],
            ...timeFilter,
        }).populate('owner hosts members', 'username displayImage');
    }

    static async calculateUserStreak(userId: string, type: PodType): Promise<number> {
        const streakPattern = `streak:${type}:*:${userId}`;
        const keys = await redisClient.keys(streakPattern);
        return keys.length;
    }
}
