import { configureStore } from "@reduxjs/toolkit";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import { combineReducers } from "redux";
import {FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { api } from "./base";
import authReducer from "@/store/auth/slice";
import podReducer from "@/store/pod/slice";
import scheduleSessionReducer from "@/store/scheduleSession/slice";

const persistConfig = {
    key: 'root',
    storage,
    whiteList: ['auth'],
};

const rootReducer = combineReducers({
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    pod: podReducer,
    scheduleSession: scheduleSessionReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
    }).concat(api.middleware),
    reducer: persistedReducer,
});

export const createStore = (): ReturnType<typeof configureStore> => configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;