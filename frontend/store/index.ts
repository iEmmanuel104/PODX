import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/api';
import userReducer from './slices/userSlice';
import podReducer from './slices/podSlice';
import mediaReducer from './slices/mediaSlice';
import toastReducer from './slices/toastSlice';
import scheduledSessionsReducer from './slices/scheduledSessionSlice';
import callStatsReducer from './slices/callStatsSlice';

import type { UserState } from './slices/userSlice';
import type { PodState } from './slices/podSlice';
import type { MediaState } from './slices/mediaSlice';
import type { toastState } from './slices/toastSlice';
import type { scheduledSessionsState } from './slices/scheduledSessionSlice';
import type { CallStatsState } from './slices/callStatsSlice';

export interface RootState {
    user: UserState;
    pod: PodState;
    media: MediaState;
    toast: toastState;
    scheduledSessions: scheduledSessionsState;
    callStats: CallStatsState;
    [apiSlice.reducerPath]: ReturnType<typeof apiSlice.reducer>;
}

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        user: userReducer,
        pod: podReducer,
        media: mediaReducer,
        toast: toastReducer,
        scheduledSessions: scheduledSessionsReducer,
        callStats: callStatsReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;