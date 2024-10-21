import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MediaState {
    isAudioEnabled: boolean
    isVideoEnabled: boolean
    isSoundDetected: boolean
}

const initialState: MediaState = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isSoundDetected: false,
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
        setSoundDetected: (state, action: PayloadAction<boolean>) => {
            state.isSoundDetected = action.payload
        },
    },
})

export const { setAudioEnabled, setVideoEnabled, setSoundDetected } = mediaSlice.actions

export default mediaSlice.reducer