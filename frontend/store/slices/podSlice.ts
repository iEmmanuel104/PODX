import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PodState {
    podId: string | null;
    participants: string[];
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

const initialState: PodState = {
    podId: null,
    participants: [],
    isAudioEnabled: true,
    isVideoEnabled: true,
};

const podSlice = createSlice({
    name: 'pod',
    initialState,
    reducers: {
        setPodId: (state, action: PayloadAction<string>) => {
            state.podId = action.payload;
        },
        addParticipant: (state, action: PayloadAction<string>) => {
            state.participants.push(action.payload);
        },
        removeParticipant: (state, action: PayloadAction<string>) => {
            state.participants = state.participants.filter(p => p !== action.payload);
        },
        toggleAudio: (state) => {
            state.isAudioEnabled = !state.isAudioEnabled;
        },
        toggleVideo: (state) => {
            state.isVideoEnabled = !state.isVideoEnabled;
        },
    },
});

export const { setPodId, addParticipant, removeParticipant, toggleAudio, toggleVideo } = podSlice.actions;
export default podSlice.reducer;