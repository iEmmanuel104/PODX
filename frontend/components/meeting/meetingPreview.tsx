import React, { useEffect, useCallback, useState } from "react";
import { VideoPreview, useCallStateHooks, useConnectedUser, createSoundDetector } from "@stream-io/video-react-sdk";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAudioEnabled, setVideoEnabled, setSoundDetected } from "@/store/slices/mediaSlice";
import SpeechIndicator from "./speechIndicator";
import { Mic, MicOff, Video, VideoOff, MoreVertical, Sparkles } from "lucide-react";
import { AudioInputDeviceSelector, AudioOutputDeviceSelector, VideoInputDeviceSelector } from "./deviceSelector";
import IconButton from "./iconButton";

const MeetingPreview: React.FC = () => {
    const user = useConnectedUser();
    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled, isSoundDetected } = useAppSelector((state) => state.media);
    const [displaySelectors, setDisplaySelectors] = useState(false);
    const [videoPreviewText, setVideoPreviewText] = useState("");

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

    useEffect(() => {
        if (hasMicrophonePermission === undefined) return;
        if ((hasMicrophonePermission && microphoneStatus) || !hasMicrophonePermission) {
            setDisplaySelectors(true);
        }
    }, [microphoneStatus, hasMicrophonePermission]);

    const toggleAudio = useCallback(() => {
        microphone.toggle().then(() => {
            dispatch(setAudioEnabled(!isAudioEnabled));
        });
    }, [microphone, dispatch, isAudioEnabled]);

    const toggleVideo = useCallback(() => {
        setVideoPreviewText(isVideoEnabled ? "Camera is off" : "Camera is starting");
        camera.toggle().then(() => {
            dispatch(setVideoEnabled(!isVideoEnabled));
            setVideoPreviewText(isVideoEnabled ? "Camera is off" : "");
        });
    }, [camera, dispatch, isVideoEnabled]);

    return (
        <div className="w-full max-w-3xl lg:pr-2 lg:mt-8">
            <div className="relative w-full rounded-lg aspect-video mx-auto shadow-md">
                <div className="absolute z-0 left-0 w-full h-full rounded-lg bg-[#121212]" />
                <div className="absolute z-2 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.4)] left-0 w-full h-full rounded-lg" />
                <div className="absolute w-full h-full [&>div]:w-auto [&>div]:h-auto z-1 flex items-center justify-center rounded-lg overflow-hidden [&_video]:-scale-x-100">
                    <VideoPreview
                        DisabledVideoPreview={() => (
                            <div className="text-2xl text-white">
                                {videoPreviewText || (isVideoEnabled ? "Camera is starting..." : "Camera is off")}
                            </div>
                        )}
                    />
                </div>
                <div className="z-3 absolute bottom-4 left-1/2 -ml-17 flex items-center gap-6">
                    <IconButton
                        icon={isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
                        onClick={toggleAudio}
                        active={!isAudioEnabled}
                        alert={!hasMicrophonePermission}
                        variant="secondary"
                    />
                    <IconButton
                        icon={isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                        onClick={toggleVideo}
                        active={!isVideoEnabled}
                        alert={!hasCameraPermission}
                        variant="secondary"
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
                <div className="z-2 absolute top-2.5 right-1 [&>button]:w-12 [&>button]:h-12 [&>button]:border-none [&>button]:transition-none [&>button]:hover:bg-[rgba(255,255,255,.2)] [&>button]:hover:shadow-none">
                    <IconButton title="More options" icon={<MoreVertical className="w-5 h-5" />} variant="secondary" />
                </div>
                <div className="z-3 absolute bottom-4 right-2.5">
                    <IconButton icon={<Sparkles className="w-5 h-5" />} title="Apply visual effects" variant="secondary" />
                </div>
            </div>
            <div className="hidden lg:flex h-17 items-center gap-1 mt-4 ml-2">
                {displaySelectors && (
                    <>
                        <AudioInputDeviceSelector disabled={!hasMicrophonePermission} />
                        <AudioOutputDeviceSelector disabled={!hasMicrophonePermission} />
                        <VideoInputDeviceSelector disabled={!hasCameraPermission} />
                    </>
                )}
            </div>
        </div>
    );
};

export default MeetingPreview;
