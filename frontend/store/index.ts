import { configureStore } from '@reduxjs/toolkit';
import podReducer from './slices/podSlice';
import userReducer from './slices/userSlice';
import mediaReducer from './slices/mediaSlice';

export const store = configureStore({
    reducer: {
        pod: podReducer,
        user: userReducer,
        media: mediaReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;