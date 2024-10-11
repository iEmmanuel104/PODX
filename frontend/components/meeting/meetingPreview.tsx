import React, { useEffect, useCallback } from "react";
import { VideoPreview, useCallStateHooks, useConnectedUser, createSoundDetector } from "@stream-io/video-react-sdk";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAudioEnabled, setVideoEnabled, setSoundDetected } from "@/store/slices/mediaSlice";
import SpeechIndicator from "./speechIndicator";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const MeetingPreview: React.FC = () => {
    const user = useConnectedUser();
    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled, isSoundDetected } = useAppSelector((state) => state.media);

    const { useCameraState, useMicrophoneState } = useCallStateHooks();
    const { camera, isMute: isCameraMute, hasBrowserPermission: hasCameraPermission } = useCameraState();
    const {
        microphone,
        isMute: isMicrophoneMute,
        hasBrowserPermission: hasMicrophonePermission,
        status: microphoneStatus,
        mediaStream,
    } = useMicrophoneState();

    useEffect(() => {
        const enableMicAndCam = async () => {
            try {
                await camera.enable();
                dispatch(setVideoEnabled(true));
            } catch (error) {
                console.error(error);
                dispatch(setVideoEnabled(false));
            }
            try {
                await microphone.enable();
                dispatch(setAudioEnabled(true));
            } catch (error) {
                console.error(error);
                dispatch(setAudioEnabled(false));
            }
        };

        enableMicAndCam();
    }, [camera, microphone, dispatch]);

    useEffect(() => {
        if (microphoneStatus !== "enabled" || !mediaStream) return;

        const disposeSoundDetector = createSoundDetector(mediaStream, ({ isSoundDetected: sd }) => dispatch(setSoundDetected(sd)), {
            detectionFrequencyInMs: 80,
            destroyStreamOnStop: false,
        });

        return () => {
            disposeSoundDetector().catch(console.error);
        };
    }, [microphoneStatus, mediaStream, dispatch]);

    const toggleAudio = useCallback(() => {
        microphone.toggle().then(() => {
            dispatch(setAudioEnabled(!isAudioEnabled));
        });
    }, [microphone, dispatch, isAudioEnabled]);

    const toggleVideo = useCallback(() => {
        camera.toggle().then(() => {
            dispatch(setVideoEnabled(!isVideoEnabled));
        });
    }, [camera, dispatch, isVideoEnabled]);

    return (
        <div className="w-full bg-[#1D1D1D] p-3.5 rounded-xl">
            <div className="relative w-full rounded-lg aspect-video mx-auto shadow-md">
                <div className="absolute z-0 left-0 w-full h-full rounded-lg bg-[#121212]" />
                <div className="absolute z-2 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.4)] left-0 w-full h-full rounded-lg" />
                <div className="absolute w-full h-full [&>div]:w-auto [&>div]:h-auto z-1 flex items-center justify-center rounded-lg overflow-hidden [&_video]:-scale-x-100">
                    <VideoPreview
                        DisabledVideoPreview={() => (
                            <div className="text-2xl text-white">{isVideoEnabled ? "Camera is starting..." : "Camera is off"}</div>
                        )}
                    />
                </div>
                {microphoneStatus === "enabled" && (
                    <div className="z-2 absolute bottom-3.5 left-3.5 w-6.5 h-6.5 flex items-center justify-center bg-[#6032F6] rounded-full">
                        <SpeechIndicator isSpeaking={isSoundDetected} />
                    </div>
                )}
                {hasCameraPermission && (
                    <div className="z-3 max-w-94 h-8 absolute left-0 top-3 mt-1.5 mb-1 mx-4 truncate text-white text-sm font-medium leading-5 flex items-center justify-start cursor-default select-none">
                        {user?.name}
                    </div>
                )}
            </div>
            <div className="flex justify-between px-2 mt-4">
                <button
                    className={`${
                        isVideoEnabled ? "bg-[#2C2C2C]" : "bg-red-500"
                    } hover:bg-[#3C3C3C] transition-colors px-4 py-3 rounded-full flex items-center`}
                    onClick={toggleVideo}
                >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                    className={`${
                        isAudioEnabled ? "bg-[#2C2C2C]" : "bg-red-500"
                    } hover:bg-[#3C3C3C] transition-colors px-4 py-3 rounded-full flex items-center`}
                    onClick={toggleAudio}
                >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default MeetingPreview;
