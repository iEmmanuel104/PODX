import { generateRoomId } from './generateRoomId';

interface PodMember {
    userId: string;
    socketId: string;
}

export interface Pod {
    id: string;
    host: string;
    members: PodMember[];
    ipfsContentHash: string;
}

export class PodManager {
    private pods: Map<string, Pod> = new Map();

    createPod(userId: string, socketId: string, ipfsContentHash: string): Pod {
        const podId = generateRoomId();
        const newPod: Pod = {
            id: podId,
            host: userId,
            members: [{ userId, socketId }],
            ipfsContentHash,
        };
        this.pods.set(podId, newPod);
        return newPod;
    }

    joinPod(podId: string, userId: string, socketId: string): Pod | null {
        const pod = this.pods.get(podId);
        if (pod) {
            pod.members.push({ userId, socketId });
            return pod;
        }
        return null;
    }

    leavePod(podId: string, userId: string): Pod | null {
        const pod = this.pods.get(podId);
        if (pod) {
            pod.members = pod.members.filter(member => member.userId !== userId);
            if (pod.members.length === 0) {
                this.pods.delete(podId);
            } else if (pod.host === userId) {
                pod.host = pod.members[0].userId;
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
}
