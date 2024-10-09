import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SocketState {
    isConnected: boolean;
}

const initialState: SocketState = {
    isConnected: false,
};

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setSocketConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
    },
});

export const { setSocketConnected } = socketSlice.actions;

export default socketSlice.reducer;