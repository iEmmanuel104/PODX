import { configureStore } from '@reduxjs/toolkit';
import podReducer from './slices/podSlice';

export const store = configureStore({
    reducer: {
        pod: podReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;