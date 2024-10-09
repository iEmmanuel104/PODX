import { configureStore } from '@reduxjs/toolkit';
import podReducer from './slices/podSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
    reducer: {
        pod: podReducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;