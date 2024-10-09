import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo } from '../api/userApi';

export interface UserState {
    user: UserInfo | null;
    signature: string | null;
    isLoggedIn: boolean;
}

const initialState: UserState = {
    user: JSON.parse(localStorage.getItem("user") || "null"),
    signature: localStorage.getItem("signature"),
    isLoggedIn: !!localStorage.getItem("user"),
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserInfo>) => {
            state.user = action.payload;
            state.isLoggedIn = true;
            localStorage.setItem("user", JSON.stringify(action.payload));
        },
        setSignature: (state, action: PayloadAction<string>) => {
            state.signature = action.payload;
            localStorage.setItem("signature", action.payload);
        },
        updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },
        logOut: (state) => {
            state.user = null;
            state.signature = null;
            state.isLoggedIn = false;
            localStorage.removeItem("user");
            localStorage.removeItem("signature");
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