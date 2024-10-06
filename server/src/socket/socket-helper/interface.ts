
export interface PodMember {
    userId: string;
    socketId: string;
    name: string;
    walletAddress: string;
    displayImage: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

export interface JoinRequest {
    userId: string;
    socketId: string;
    name: string;
    walletAddress: string;
    displayImage: string;
}

export type PodType = 'open' | 'trusted';

export interface Pod {
    id: string;
    owner: string;
    hosts: string[];
    ipfsContentHash: string;
    type: PodType;
    stats: {
        memberCount: number;
        hostCount: number;
        joinRequestCount: number;
        coHostRequestCount: number;
    };
}
