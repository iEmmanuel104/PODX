import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo } from '../api/userApi';

export interface UserState {
    user: UserInfo | null;
    signature: string | null;
    isLoggedIn: boolean;
}

const initialState: UserState = {
    user: null,
    signature: null,
    isLoggedIn: false,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserInfo>) => {
            state.user = action.payload;
            state.isLoggedIn = true;
        },
        setSignature: (state, action: PayloadAction<string>) => {
            state.signature = action.payload;
        },
        updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        logOut: (state) => {
            state.user = null;
            state.signature = null;
            state.isLoggedIn = false;
        },
    },
});

export const {
    setUser,
    setSignature,
    updateUser,
    logOut,
} = userSlice.actions;

export default userSlice.reducer;