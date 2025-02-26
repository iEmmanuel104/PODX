import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { UserInfo } from '../user/types';

type AuthState = {
    user: UserInfo | null;
    signature: string | null;
    isLoggedIn: boolean;
};

const initialState: AuthState = {
    user: null,
    signature: null,
    isLoggedIn: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logOut: state => {
            state.user = null;
            state.signature = null;
            state.isLoggedIn = false;
        },
        setUser(state, { payload }: PayloadAction<UserInfo>) {
            state.user = payload;
            state.isLoggedIn = true;
        },
        setFirstTimeUser: (state, action: PayloadAction<boolean>) => {
            if (state.user) {
                state.user.firstTimeUser = action.payload;
            }
        },
        setSignature(state, { payload }: PayloadAction<string>) {
            state.signature = payload;
        },
        updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
});

export default authSlice.reducer;
export const { setUser, setSignature, updateUser, setFirstTimeUser, logOut } = authSlice.actions;
