import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MediaState {
    isAudioEnabled: boolean
    isVideoEnabled: boolean
}

const initialState: MediaState = {
    isAudioEnabled: true,
    isVideoEnabled: true,
}

const mediaSlice = createSlice({
    name: 'media',
    initialState,
    reducers: {
        setAudioEnabled: (state, action: PayloadAction<boolean>) => {
            state.isAudioEnabled = action.payload
        },
        setVideoEnabled: (state, action: PayloadAction<boolean>) => {
            state.isVideoEnabled = action.payload
        },
    },
})

export const { setAudioEnabled, setVideoEnabled } = mediaSlice.actions

export default mediaSlice.reducer