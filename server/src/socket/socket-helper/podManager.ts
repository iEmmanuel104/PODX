// src/socket/helpers/PodManager.ts
import { generateRoomId } from '../socket-helper/generateRoomId';

interface PodMember {
    userId: string;
    socketId: string;
}

export interface Pod {
    id: string;
    owner: string;
    hosts: string[];
    members: PodMember[];
    ipfsContentHash: string;
    coHostRequests: string[];
}

export class PodManager {
    private pods: Map<string, Pod> = new Map();

    createPod(userId: string, socketId: string, ipfsContentHash: string): Pod {
        const podId = generateRoomId();
        const newPod: Pod = {
            id: podId,
            owner: userId,
            hosts: [userId],
            members: [{ userId, socketId }],
            ipfsContentHash,
            coHostRequests: [],
        };
        this.pods.set(podId, newPod);
        return newPod;
    }

    joinPod(podId: string, userId: string, socketId: string): Pod | null {
        const pod = this.pods.get(podId);
        if (pod) {
            if (!pod.members.some(member => member.userId === userId)) {
                pod.members.push({ userId, socketId });
            }
            return pod;
        }
        return null;
    }

    leavePod(podId: string, userId: string): Pod | null {
        const pod = this.pods.get(podId);
        if (pod) {
            pod.members = pod.members.filter(member => member.userId !== userId);
            pod.hosts = pod.hosts.filter(hostId => hostId !== userId);
            pod.coHostRequests = pod.coHostRequests.filter(requesterId => requesterId !== userId);

            if (pod.members.length === 0) {
                this.pods.delete(podId);
            } else if (pod.owner === userId && pod.hosts.length > 0) {
                pod.owner = pod.hosts[0];
            }
            return pod;
        }
        return null;
    }

    getPod(podId: string): Pod | undefined {
        return this.pods.get(podId);
    }

    updatePodContent(podId: string, newIpfsContentHash: string): boolean {
        const pod = this.pods.get(podId);
        if (pod) {
            pod.ipfsContentHash = newIpfsContentHash;
            return true;
        }
        return false;
    }

    requestCoHost(podId: string, userId: string): boolean {
        const pod = this.pods.get(podId);
        if (pod && !pod.hosts.includes(userId) && !pod.coHostRequests.includes(userId)) {
            pod.coHostRequests.push(userId);
            return true;
        }
        return false;
    }

    approveCoHost(podId: string, approverUserId: string, coHostUserId: string): boolean {
        const pod = this.pods.get(podId);
        if (pod && (pod.owner === approverUserId || pod.hosts.includes(approverUserId))) {
            const requestIndex = pod.coHostRequests.indexOf(coHostUserId);
            if (requestIndex !== -1) {
                pod.coHostRequests.splice(requestIndex, 1);
                if (!pod.hosts.includes(coHostUserId)) {
                    pod.hosts.push(coHostUserId);
                }
                return true;
            }
        }
        return false;
    }
}