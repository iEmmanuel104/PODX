import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Participant {
    userId: string;
    socketId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    audioTrackId: string | null;
    videoTrackId: string | null;
}

interface CoHostRequest {
    userId: string;
    podId: string;
}

interface JoinRequest {
    userId: string;
    podId: string;
}

interface Error {
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
}

const initialState: PodState = {
    podId: null,
    participants: [],
    localUser: {
        isAudioEnabled: true,
        isVideoEnabled: true,
        audioTrackId: null,
        videoTrackId: null,
    },
    messages: [],
    podType: null,
    stats: {
        memberCount: 0,
        hostCount: 0,
        joinRequestCount: 0,
        coHostRequestCount: 0,
    },
    ipfsContentHash: null,
    coHostRequests: [],
    joinRequests: [],
    errors: [],
    pendingTipTransaction: null,
    isScreenSharing: false,
    screenSharingUserId: null,
};

const podSlice = createSlice({
    name: 'pod',
    initialState,
    reducers: {
        setPodId: (state, action: PayloadAction<string | null>) => {
            state.podId = action.payload;
        },
        addParticipant: (state, action: PayloadAction<{ userId: string; socketId: string }>) => {
            if (!state.participants.some(p => p.userId === action.payload.userId)) {
                state.participants.push({
                    ...action.payload,
                    isAudioEnabled: true,
                    isVideoEnabled: true,
                    audioTrackId: null,
                    videoTrackId: null,
                });
            }
        },
        removeParticipant: (state, action: PayloadAction<string>) => {
            state.participants = state.participants.filter(p => p.userId !== action.payload);
        },
        toggleLocalAudio: (state) => {
            state.localUser.isAudioEnabled = !state.localUser.isAudioEnabled;
        },
        toggleLocalVideo: (state) => {
            state.localUser.isVideoEnabled = !state.localUser.isVideoEnabled;
        },
        setLocalTracks: (state, action: PayloadAction<{ audioTrackId: string | null; videoTrackId: string | null }>) => {
            state.localUser.audioTrackId = action.payload.audioTrackId;
            state.localUser.videoTrackId = action.payload.videoTrackId;
        },
        updateParticipantTrack: (state, action: PayloadAction<{ userId: string; kind: 'audio' | 'video'; trackId: string | null }>) => {
            const participant = state.participants.find(p => p.userId === action.payload.userId);
            if (participant) {
                if (action.payload.kind === 'audio') {
                    participant.audioTrackId = action.payload.trackId;
                } else {
                    participant.videoTrackId = action.payload.trackId;
                }
            }
        },
        addMessage: (state, action: PayloadAction<{ userId: string; message: string }>) => {
            state.messages.push(action.payload);
        },
        setPodType: (state, action: PayloadAction<'open' | 'trusted' | null>) => {
            state.podType = action.payload;
        },
        updatePodStats: (state, action: PayloadAction<Partial<PodState['stats']>>) => {
            state.stats = { ...state.stats, ...action.payload };
        },
        updateParticipantAudioState: (state, action: PayloadAction<{ userId: string; isAudioEnabled: boolean }>) => {
            const participant = state.participants.find(p => p.userId === action.payload.userId);
            if (participant) {
                participant.isAudioEnabled = action.payload.isAudioEnabled;
            }
        },
        updateParticipantVideoState: (state, action: PayloadAction<{ userId: string; isVideoEnabled: boolean }>) => {
            const participant = state.participants.find(p => p.userId === action.payload.userId);
            if (participant) {
                participant.isVideoEnabled = action.payload.isVideoEnabled;
            }
        },
        updatePodContent: (state, action: PayloadAction<{ podId: string; newIpfsContentHash: string }>) => {
            if (state.podId === action.payload.podId) {
                state.ipfsContentHash = action.payload.newIpfsContentHash;
            }
        },
        addCoHostRequest: (state, action: PayloadAction<CoHostRequest>) => {
            if (!state.coHostRequests.some(request => request.userId === action.payload.userId && request.podId === action.payload.podId)) {
                state.coHostRequests.push(action.payload);
                state.stats.coHostRequestCount++;
            }
        },
        removeCoHostRequest: (state, action: PayloadAction<{ userId: string; podId: string }>) => {
            state.coHostRequests = state.coHostRequests.filter(
                request => !(request.userId === action.payload.userId && request.podId === action.payload.podId)
            );
            state.stats.coHostRequestCount = state.coHostRequests.length;
        },
        addJoinRequest: (state, action: PayloadAction<JoinRequest>) => {
            if (!state.joinRequests.some(request => request.userId === action.payload.userId && request.podId === action.payload.podId)) {
                state.joinRequests.push(action.payload);
                state.stats.joinRequestCount++;
            }
        },
        removeJoinRequest: (state, action: PayloadAction<{ userId: string; podId: string }>) => {
            state.joinRequests = state.joinRequests.filter(
                request => !(request.userId === action.payload.userId && request.podId === action.payload.podId)
            );
            state.stats.joinRequestCount = state.joinRequests.length;
        },
        setError: (state, action: PayloadAction<Error>) => {
            state.errors.push(action.payload);
        },
        clearErrors: (state) => {
            state.errors = [];
        },
        setPendingTipTransaction: (state, action: PayloadAction<string | null>) => {
            state.pendingTipTransaction = action.payload;
        },
        setScreenSharing: (state, action: PayloadAction<{ isScreenSharing: boolean; userId: string | null }>) => {
            state.isScreenSharing = action.payload.isScreenSharing;
            state.screenSharingUserId = action.payload.userId;
        },
        clearPodState: (state) => {
            Object.assign(state, initialState);
        },
    },
});

export const {
    setPodId,
    addParticipant,
    removeParticipant,
    toggleLocalAudio,
    toggleLocalVideo,
    setLocalTracks,
    updateParticipantTrack,
    addMessage,
    setPodType,
    updatePodStats,
    updateParticipantAudioState,
    updateParticipantVideoState,
    updatePodContent,
    addCoHostRequest,
    removeCoHostRequest,
    addJoinRequest,
    removeJoinRequest,
    setError,
    clearErrors,
    setPendingTipTransaction,
    setScreenSharing,
    clearPodState
} = podSlice.actions;

export default podSlice.reducer;