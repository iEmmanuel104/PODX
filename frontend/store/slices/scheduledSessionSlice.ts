// store/slices/scheduledSessionsSlice.ts
import { StreamCallData } from "@/components/pod/streamCallData";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface scheduledSessionsState {
    sessions: StreamCallData[];
}

const initialState: scheduledSessionsState = {
    sessions: []
};

const scheduledSessionsSlice = createSlice({
    name: 'scheduledSessions',
    initialState,
    reducers: {
        setScheduledSessions: (state, action: PayloadAction<StreamCallData[]>) => {
            state.sessions = action.payload;
        },
        addScheduledSession: (state, action: PayloadAction<StreamCallData>) => {
            state.sessions.push(action.payload);
        },
        clearScheduledSessions: (state) => {
            state.sessions = [];
        }
    }
});

export const { setScheduledSessions, addScheduledSession, clearScheduledSessions } = scheduledSessionsSlice.actions;
export default scheduledSessionsSlice.reducer;