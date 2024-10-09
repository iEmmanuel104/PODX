import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setAudioEnabled, setVideoEnabled } from '@/store/slices/mediaSlice';

export const useMediaPermissions = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                dispatch(setAudioEnabled(true));
                dispatch(setVideoEnabled(true));
                // Stop the tracks immediately as we don't need them right now
                stream.getTracks().forEach(track => track.stop());
            })
            .catch((error) => {
                console.error("Error accessing media devices:", error);
                dispatch(setAudioEnabled(false));
                dispatch(setVideoEnabled(false));
            });
    }, [dispatch]);
};