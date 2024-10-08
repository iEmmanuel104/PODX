import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Participant {
    userId: string;
    socketId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

interface PodState {
    podId: string | null;
    participants: Participant[];
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    messages: { userId: string; message: string }[];
    podType: 'open' | 'trusted' | null;
    stats: {
        memberCount: number;
        hostCount: number;
        joinRequestCount: number;
        coHostRequestCount: number;
    };
    ipfsContentHash: string | null;
}

const initialState: PodState = {
    podId: null,
    participants: [],
    isAudioEnabled: true,
    isVideoEnabled: true,
    messages: [],
    podType: null,
    stats: {
        memberCount: 0,
        hostCount: 0,
        joinRequestCount: 0,
        coHostRequestCount: 0,
    },
    ipfsContentHash: null,
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
                });
            }
        },
        removeParticipant: (state, action: PayloadAction<string>) => {
            state.participants = state.participants.filter(p => p.userId !== action.payload);
        },
        toggleAudio: (state) => {
            state.isAudioEnabled = !state.isAudioEnabled;
        },
        toggleVideo: (state) => {
            state.isVideoEnabled = !state.isVideoEnabled;
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
        clearPodState: (state) => {
            Object.assign(state, initialState);
        },
    },
});

export const {
    setPodId,
    addParticipant,
    removeParticipant,
    toggleAudio,
    toggleVideo,
    addMessage,
    setPodType,
    updatePodStats,
    updateParticipantAudioState,
    updateParticipantVideoState,
    updatePodContent,
    clearPodState
} = podSlice.actions;

export default podSlice.reducer;