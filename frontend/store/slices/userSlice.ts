import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    walletAddress: string | null;
    smartWalletAddress: string | null;
    smartWalletType: string | null;
    username: string | null;
    isLoggedIn: boolean;
}

const initialState: UserState = {
    walletAddress: null,
    smartWalletAddress: null,
    smartWalletType: null,
    username: null,
    isLoggedIn: false,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserInfo: (state, action: PayloadAction<Partial<UserState>>) => {
            return { ...state, ...action.payload };
        },
        clearUserInfo: (state) => {
            return initialState;
        },
    },
});

export const { setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;