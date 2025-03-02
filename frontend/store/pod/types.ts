import { sessionType, streamCallType } from '@/constants';

export interface Participant {
    userId: string;
    socketId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    audioTrackId: string | null;
    videoTrackId: string | null;
}

export interface CoHostRequest {
    userId: string;
    podId: string;
}

export interface JoinRequest {
    userId: string;
    podId: string;
}

export interface Error {
    type: string;
    message: string;
}

export interface PodState {
    podId: string | null;
    participants: Participant[];
    localUser: {
        isAudioEnabled: boolean;
        isVideoEnabled: boolean;
        audioTrackId: string | null;
        videoTrackId: string | null;
    };
    messages: { userId: string; message: string }[];
    podType: 'open' | 'trusted' | null;
    stats: {
        memberCount: number;
        hostCount: number;
        joinRequestCount: number;
        coHostRequestCount: number;
    };
    ipfsContentHash: string | null;
    coHostRequests: CoHostRequest[];
    joinRequests: JoinRequest[];
    errors: Error[];
    pendingTipTransaction: string | null;
    isScreenSharing: boolean;
    screenSharingUserId: string | null;
    sessionTitle: string;
    sessionType: sessionType | '';
    sessionId: string;
    streamCallType: (typeof streamCallType)[keyof typeof streamCallType] | '';
    starts_at?: string;
    isScheduled?: boolean;
    isNewMeeting: boolean;
    tokenGate?: string[];
}
