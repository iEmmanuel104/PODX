import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toastState } from "./types";

const initialState: toastState = {
    message: null,
    isVisible: false,
};

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        setToast: (state, action: PayloadAction<string>) => {
            state.message = action.payload;
            state.isVisible = true;
        },
        clearToast: state => {
            state.message = null;
            state.isVisible = false;
        },
    },
});

export const { setToast, clearToast } = toastSlice.actions;
export default toastSlice.reducer;