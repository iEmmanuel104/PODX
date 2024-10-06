import { generateRoomId } from './generateRoomId';
import { IUser } from '../../models/Mongodb/user.model'; // Adjust the import path as needed
import { Pod, PodMember, JoinRequest, PodType } from './interface';

export class PodManager {
    private pods: Map<string, Pod> = new Map();
    private podMembers: Map<string, PodMember[]> = new Map();
    private podJoinRequests: Map<string, JoinRequest[]> = new Map();
    private podCoHostRequests: Map<string, PodMember[]> = new Map();

    async createPod(user: IUser, socketId: string, ipfsContentHash: string): Promise<Pod> {
        const podId = generateRoomId();
        const newPod: Pod = {
            id: podId,
            owner: user.id,
            hosts: [user.id],
            ipfsContentHash,
            type: 'open',
            stats: {
                memberCount: 1,
                hostCount: 1,
                joinRequestCount: 0,
                coHostRequestCount: 0,
            },
        };
        this.pods.set(podId, newPod);

        const newMember = await this.createPodMember(user, socketId);
        this.podMembers.set(podId, [newMember]);
        this.podJoinRequests.set(podId, []);
        this.podCoHostRequests.set(podId, []);

        return newPod;
    }

    async joinPod(podId: string, user: IUser, socketId: string): Promise<'joined' | 'requested' | null> {
        const pod = this.pods.get(podId);
        if (pod) {
            if (pod.type === 'open' || pod.hosts.includes(user.id)) {
                const members = this.podMembers.get(podId) || [];
                if (!members.some(member => member.userId === user.id)) {
                    const newMember = await this.createPodMember(user, socketId);
                    members.push(newMember);
                    this.podMembers.set(podId, members);
                    pod.stats.memberCount++;
                }
                return 'joined';
            } else if (pod.type === 'trusted') {
                const joinRequests = this.podJoinRequests.get(podId) || [];
                if (!joinRequests.some(request => request.userId === user.id)) {
                    const newRequest = await this.createJoinRequest(user, socketId);
                    joinRequests.push(newRequest);
                    this.podJoinRequests.set(podId, joinRequests);
                    pod.stats.joinRequestCount++;
                }
                return 'requested';
            }
        }
        return null;
    }

    leavePod(podId: string, userId: string): Pod | null {
        const pod = this.pods.get(podId);
        if (pod) {
            // Remove from members
            const members = this.podMembers.get(podId) || [];
            const updatedMembers = members.filter(member => member.userId !== userId);
            this.podMembers.set(podId, updatedMembers);

            // Remove from hosts
            pod.hosts = pod.hosts.filter(hostId => hostId !== userId);

            // Remove from co-host requests
            const coHostRequests = this.podCoHostRequests.get(podId) || [];
            const updatedCoHostRequests = coHostRequests.filter(request => request.userId !== userId);
            this.podCoHostRequests.set(podId, updatedCoHostRequests);

            // Remove from join requests
            const joinRequests = this.podJoinRequests.get(podId) || [];
            const updatedJoinRequests = joinRequests.filter(request => request.userId !== userId);
            this.podJoinRequests.set(podId, updatedJoinRequests);

            // Update pod stats
            pod.stats = {
                memberCount: updatedMembers.length,
                hostCount: pod.hosts.length,
                joinRequestCount: updatedJoinRequests.length,
                coHostRequestCount: updatedCoHostRequests.length,
            };

            // Check if pod should be deleted
            if (updatedMembers.length === 0) {
                this.pods.delete(podId);
                this.podMembers.delete(podId);
                this.podJoinRequests.delete(podId);
                this.podCoHostRequests.delete(podId);
            } else if (pod.owner === userId && pod.hosts.length > 0) {
                // If the owner is leaving, assign a new owner
                pod.owner = pod.hosts[0];
            }

            return pod;
        }
        return null;
    }

    getPod(podId: string): Pod | undefined {
        return this.pods.get(podId);
    }

    getPodMembers(podId: string): PodMember[] | null {
        return this.podMembers.get(podId) || null;
    }

    updatePodContent(podId: string, newIpfsContentHash: string): boolean {
        const pod = this.pods.get(podId);
        if (pod) {
            pod.ipfsContentHash = newIpfsContentHash;
            return true;
        }
        return false;
    }

    async getJoinRequests(podId: string, userId: string): Promise<JoinRequest[] | null> {
        const pod = this.pods.get(podId);
        if (pod && (pod.owner === userId || pod.hosts.includes(userId))) {
            return this.podJoinRequests.get(podId) || [];
        }
        return null;
    }

    async getCoHostRequests(podId: string, userId: string): Promise<PodMember[] | null> {
        const pod = this.pods.get(podId);
        if (pod && (pod.owner === userId || pod.hosts.includes(userId))) {
            return this.podCoHostRequests.get(podId) || [];
        }
        return null;
    }

    requestCoHost(podId: string, userId: string): boolean {
        const pod = this.pods.get(podId);
        if (pod && !pod.hosts.includes(userId)) {
            const coHostRequests = this.podCoHostRequests.get(podId) || [];
            if (!coHostRequests.some(request => request.userId === userId)) {
                coHostRequests.push(this.podMembers.get(podId)!.find(member => member.userId === userId)!);
                this.podCoHostRequests.set(podId, coHostRequests);
                pod.stats.coHostRequestCount++;
                return true;
            }
        }
        return false;
    }

    approveCoHost(podId: string, approverUserId: string, coHostUserId: string): boolean {
        const pod = this.pods.get(podId);
        if (pod && (pod.owner === approverUserId || pod.hosts.includes(approverUserId))) {
            const coHostRequests = this.podCoHostRequests.get(podId) || [];
            const request = coHostRequests.find(request => request.userId === coHostUserId);
            const requestIndex = request ? coHostRequests.indexOf(request) : -1;
            if (requestIndex !== -1) {
                coHostRequests.splice(requestIndex, 1);
                this.podCoHostRequests.set(podId, coHostRequests);
                if (!pod.hosts.includes(coHostUserId)) {
                    pod.hosts.push(coHostUserId);
                    pod.stats.hostCount++;
                }
                pod.stats.coHostRequestCount--;
                return true;
            }
        }
        return false;
    }

    changePodType(podId: string, userId: string, newType: PodType): string[] {
        const pod = this.pods.get(podId);
        if (pod && pod.owner === userId) {
            pod.type = newType;
            if (newType === 'open') {
                const joinRequests = this.podJoinRequests.get(podId) || [];
                const admittedUsers = joinRequests.map(request => request.userId);
                const members = this.podMembers.get(podId) || [];

                joinRequests.forEach(request => {
                    if (!members.some(member => member.userId === request.userId)) {
                        members.push({
                            userId: request.userId,
                            socketId: request.socketId,
                            name: request.name,
                            walletAddress: request.walletAddress,
                            displayImage: request.displayImage,
                            isAudioEnabled: true,
                            isVideoEnabled: true,
                        });
                    }
                });

                this.podMembers.set(podId, members);
                this.podJoinRequests.set(podId, []);

                pod.stats.memberCount = members.length;
                pod.stats.joinRequestCount = 0;

                return admittedUsers;
            }
        }
        return [];
    }

    async approveJoinRequest(podId: string, approverUserId: string, joinUserId: string): Promise<boolean> {
        const pod = this.pods.get(podId);
        if (pod && pod.type === 'trusted' && (pod.owner === approverUserId || pod.hosts.includes(approverUserId))) {
            const joinRequests = this.podJoinRequests.get(podId) || [];
            const requestIndex = joinRequests.findIndex(request => request.userId === joinUserId);
            if (requestIndex !== -1) {
                const approvedRequest = joinRequests.splice(requestIndex, 1)[0];
                this.podJoinRequests.set(podId, joinRequests);

                const members = this.podMembers.get(podId) || [];
                if (!members.some(member => member.userId === joinUserId)) {
                    const newMember: PodMember = {
                        ...approvedRequest,
                        isAudioEnabled: true,
                        isVideoEnabled: true,
                    };
                    members.push(newMember);
                    this.podMembers.set(podId, members);
                }

                pod.stats.memberCount = members.length;
                pod.stats.joinRequestCount = joinRequests.length;

                return true;
            }
        }
        return false;
    }

    async approveAllJoinRequests(podId: string, approverUserId: string): Promise<string[]> {
        const pod = this.pods.get(podId);
        if (pod && (pod.owner === approverUserId || pod.hosts.includes(approverUserId))) {
            const joinRequests = this.podJoinRequests.get(podId) || [];
            const approvedUsers = joinRequests.map(request => request.userId);

            const members = this.podMembers.get(podId) || [];
            joinRequests.forEach(request => {
                if (!members.some(member => member.userId === request.userId)) {
                    const newMember: PodMember = {
                        ...request,
                        isAudioEnabled: true,
                        isVideoEnabled: true,
                    };
                    members.push(newMember);
                }
            });

            this.podMembers.set(podId, members);
            this.podJoinRequests.set(podId, []);

            pod.stats.memberCount = members.length;
            pod.stats.joinRequestCount = 0;

            return approvedUsers;
        }
        return [];
    }

    private async createPodMember(user: IUser, socketId: string): Promise<PodMember> {
        return {
            userId: user.id,
            socketId,
            name: `${user.firstName} ${user.lastName}`,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage || '',
            isAudioEnabled: true,
            isVideoEnabled: true,
        };
    }

    private async createJoinRequest(user: IUser, socketId: string): Promise<JoinRequest> {
        return {
            userId: user.id,
            socketId,
            name: `${user.firstName} ${user.lastName}`,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage || '',
        };
    }

    async updateUserInfo(podId: string, userId: string, userInfo: Partial<PodMember>): Promise<boolean> {
        const members = this.podMembers.get(podId);
        if (members) {
            const memberIndex = members.findIndex(m => m.userId === userId);
            if (memberIndex !== -1) {
                members[memberIndex] = { ...members[memberIndex], ...userInfo };
                this.podMembers.set(podId, members);
                return true;
            }
        }
        return false;
    }

    getUserPods(userId: string): string[] {
        const userPods: string[] = [];
        for (const [podId, members] of this.podMembers.entries()) {
            if (members.some(member => member.userId === userId)) {
                userPods.push(podId);
            }
        }
        return userPods;
    }

}
