import { StreamCallData } from '@/components/pod/streamCallData';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { scheduledSessionsState } from './types';

const initialState: scheduledSessionsState = {
    sessions: [],
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
        removeScheduledSession: (state, action: PayloadAction<string>) => {
            state.sessions = state.sessions.filter(session => session.id !== action.payload);
        },
        clearScheduledSessions: state => {
            state.sessions = [];
        },
    },
});

export const {
    setScheduledSessions,
    addScheduledSession,
    removeScheduledSession,
    clearScheduledSessions
} = scheduledSessionsSlice.actions;
export default scheduledSessionsSlice.reducer;
