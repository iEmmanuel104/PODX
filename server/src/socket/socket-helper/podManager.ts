import { generateRoomId } from './generateRoomId';
import { IUser } from '../../models/Mongodb/user.model';
import { PodMember, PodType } from './interface';
import { Pod, IPod } from '../../models/Mongodb/pod.model';
import { getRedisPubClient } from '../index';
import { redisClient } from '../../utils/redis';
import { Types } from 'mongoose';

export class PodManager {
    private redisPub: ReturnType<typeof getRedisPubClient>;

    constructor() {
        this.redisPub = getRedisPubClient();
    }

    async createPod(user: IUser, socketId: string, ipfsContentHash: string): Promise<IPod> {
        const podId = generateRoomId();
        const newPod = new Pod({
            id: podId,
            owner: user._id,
            hosts: [user._id],
            members: [user._id],
            ipfsContentHash,
            type: 'open' as PodType,
            stats: {
                memberCount: 1,
                hostCount: 1,
                joinRequestCount: 0,
                coHostRequestCount: 0,
            },
        });
        await newPod.save();

        const memberData: PodMember = {
            userId: user.id,
            socketId,
            name: `${user.firstName} ${user.lastName}`,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage || '',
            isAudioEnabled: true,
            isVideoEnabled: true,
        };

        // Store pod info in Redis
        const podInfo = {
            id: podId,
            owner: user.id,
            hosts: [user.id],
            type: 'open',
        };
        await redisClient.hset(`pod:${podId}`, 'info', JSON.stringify(podInfo));

        await redisClient.hset(`pod:${podId}:members`, user.id, JSON.stringify(memberData));
        await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'pod-created', podId, userId: user.id }));

        return newPod;
    }

    async joinPod(podId: string, user: IUser, socketId: string): Promise<'joined' | 'requested' | null> {
        const pod = await Pod.findOne({ id: podId });
        if (pod) {
            if (pod.type === 'open' || pod.hosts.includes(user.id)) {
                if (!pod.members.includes(user.id)) {
                    pod.members.push(user.id);
                    pod.stats.memberCount++;
                    await pod.save();
                }

                const memberData: PodMember = {
                    userId: user.id,
                    socketId,
                    name: `${user.firstName} ${user.lastName}`,
                    walletAddress: user.walletAddress,
                    displayImage: user.displayImage || '',
                    isAudioEnabled: true,
                    isVideoEnabled: true,
                };

                await redisClient.hset(`pod:${podId}:members`, user.id, JSON.stringify(memberData));
                await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'user-joined', podId, userId: user.id }));
                return 'joined';
            } else if (pod.type === 'trusted') {
                await redisClient.sadd(`pod:${podId}:joinRequests`, user.id);
                pod.stats.joinRequestCount++;
                await pod.save();
                await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'join-requested', podId, userId: user.id }));
                return 'requested';
            }
        }
        return null;
    }


    async leavePod(podId: string, userId: string): Promise<IPod | null> {
        const pod = await Pod.findOne({ id: podId });
        if (pod) {
            pod.members = pod.members.filter(memberId => memberId.toString() !== userId);
            pod.hosts = pod.hosts.filter(hostId => hostId.toString() !== userId);
            pod.stats.memberCount = pod.members.length;
            pod.stats.hostCount = pod.hosts.length;

            if (pod.stats.memberCount === 0) {
                await Pod.deleteOne({ id: podId });
                await redisClient.del(`pod:${podId}:members`);
                await redisClient.del(`pod:${podId}:joinRequests`);
                await redisClient.del(`pod:${podId}:coHostRequests`);
            } else {
                if (pod.owner.toString() === userId && pod.hosts.length > 0) {
                    pod.owner = pod.hosts[0];
                }
                await pod.save();
            }

            await redisClient.hdel(`pod:${podId}:members`, userId);
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'user-left', podId, userId }));

            return pod;
        }
        return null;
    }

    async getPod(podId: string): Promise<IPod | null> {
        return Pod.findOne({ id: podId }).populate('owner hosts members');
    }

    async getPodMembers(podId: string): Promise<PodMember[]> {
        const memberData = await redisClient.hgetall(`pod:${podId}:members`);
        return Object.values(memberData).map(data => JSON.parse(data));
    }

    async updatePodContent(podId: string, newIpfsContentHash: string): Promise<boolean> {
        const result = await Pod.updateOne({ id: podId }, { ipfsContentHash: newIpfsContentHash });
        if (result.modifiedCount > 0) {
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'content-updated', podId, newIpfsContentHash }));
            return true;
        }
        return false;
    }

    async getJoinRequests(podId: string): Promise<string[]> {
        return redisClient.smembers(`pod:${podId}:joinRequests`);
    }

    async getCoHostRequests(podId: string): Promise<string[]> {
        return redisClient.smembers(`pod:${podId}:coHostRequests`);
    }

    async requestCoHost(podId: string, userId: string): Promise<boolean> {
        const added = await redisClient.sadd(`pod:${podId}:coHostRequests`, userId);
        if (added) {
            const pod = await Pod.findOne({ id: podId });
            if (pod) {
                pod.stats.coHostRequestCount++;
                await pod.save();
                await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'cohost-requested', podId, userId }));
                return true;
            }
        }
        return false;
    }

    async approveCoHost(podId: string, coHostUserId: string): Promise<boolean> {
        const pod = await Pod.findOne({ id: podId });
        if (pod && !pod.hosts.some(hostId => hostId.toString() === coHostUserId)) {
            pod.hosts.push(new Types.ObjectId(coHostUserId));
            pod.stats.hostCount++;
            pod.stats.coHostRequestCount--;
            await pod.save();

            // Update Redis
            const podInfo = await redisClient.hget(`pod:${podId}`, 'info');
            if (podInfo) {
                const updatedPodInfo = JSON.parse(podInfo);
                updatedPodInfo.hosts.push(coHostUserId);
                await redisClient.hset(`pod:${podId}`, 'info', JSON.stringify(updatedPodInfo));
            }

            await redisClient.srem(`pod:${podId}:coHostRequests`, coHostUserId);
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'cohost-approved', podId, userId: coHostUserId }));
            return true;
        }
        return false;
    }

    async changePodType(podId: string, newType: PodType): Promise<string[]> {
        const pod = await Pod.findOne({ id: podId });
        if (pod) {
            pod.type = newType;
            if (newType === 'open') {
                const joinRequests = await this.getJoinRequests(podId);
                for (const userId of joinRequests) {
                    if (!pod.members.some(memberId => memberId.toString() === userId)) {
                        pod.members.push(new Types.ObjectId(userId));
                    }
                }
                pod.stats.memberCount = pod.members.length;
                pod.stats.joinRequestCount = 0;
                await redisClient.del(`pod:${podId}:joinRequests`);
                await pod.save();
                await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'pod-type-changed', podId, newType, admittedUsers: joinRequests }));
                return joinRequests;
            }
            await pod.save();
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'pod-type-changed', podId, newType }));
        }
        return [];
    }

    async approveJoinRequest(podId: string, joinUserId: string): Promise<boolean> {
        const pod = await Pod.findOne({ id: podId });
        if (pod && pod.type === 'trusted') {
            const isRequested = await redisClient.sismember(`pod:${podId}:joinRequests`, joinUserId);
            if (isRequested) {
                pod.members.push(new Types.ObjectId(joinUserId));
                pod.stats.memberCount++;
                pod.stats.joinRequestCount--;
                await pod.save();
                await redisClient.srem(`pod:${podId}:joinRequests`, joinUserId);
                await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'join-approved', podId, userId: joinUserId }));
                return true;
            }
        }
        return false;
    }

    async updateUserInfo(podId: string, userId: string, userInfo: Partial<PodMember>): Promise<boolean> {
        const memberData = await redisClient.hget(`pod:${podId}:members`, userId);
        if (memberData) {
            const updatedData = { ...JSON.parse(memberData), ...userInfo };
            await redisClient.hset(`pod:${podId}:members`, userId, JSON.stringify(updatedData));
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'user-info-updated', podId, userId, ...userInfo }));
            return true;
        }
        return false;
    }

    async getUserPods(userId: string): Promise<string[]> {
        const pods = await Pod.find({ members: new Types.ObjectId(userId) }, 'id');
        return pods.map(pod => pod.id);
    }

    async muteUser(podId: string, userId: string, muteType: 'audio' | 'video', isMuted: boolean): Promise<boolean> {
        const memberData = await redisClient.hget(`pod:${podId}:members`, userId);
        if (memberData) {
            const updatedData = JSON.parse(memberData);
            if (muteType === 'audio') {
                updatedData.isAudioEnabled = !isMuted;
            } else {
                updatedData.isVideoEnabled = !isMuted;
            }
            await redisClient.hset(`pod:${podId}:members`, userId, JSON.stringify(updatedData));
            await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'user-muted', podId, userId, muteType, isMuted }));
            return true;
        }
        return false;
    }

    async muteAllUsers(podId: string, muteType: 'audio' | 'video', isMuted: boolean): Promise<boolean> {
        const members = await redisClient.hgetall(`pod:${podId}:members`);
        for (const [userId, data] of Object.entries(members)) {
            const updatedData = JSON.parse(data);
            if (muteType === 'audio') {
                updatedData.isAudioEnabled = !isMuted;
            } else {
                updatedData.isVideoEnabled = !isMuted;
            }
            await redisClient.hset(`pod:${podId}:members`, userId, JSON.stringify(updatedData));
        }
        await this.redisPub.publish('pod-updates', JSON.stringify({ type: 'all-users-muted', podId, muteType, isMuted }));
        return true;
    }

    async isUserAuthorized(podId: string, userId: string): Promise<boolean> {
        // First, check if the user is a member of the pod using Redis
        const isMember = await redisClient.hexists(`pod:${podId}:members`, userId);
        if (!isMember) return false;

        // If the user is a member, get the pod data from Redis
        const podData = await redisClient.hget(`pod:${podId}`, 'info');
        if (podData) {
            const pod = JSON.parse(podData);
            return pod.owner === userId || pod.hosts.includes(userId);
        }

        // If Redis doesn't have the pod data, fall back to MongoDB
        const pod = await Pod.findOne({ id: podId });
        if (!pod) return false;

        return pod.owner.toString() === userId || pod.hosts.some(hostId => hostId.toString() === userId);
    }
}