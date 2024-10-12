import React, { useEffect, useCallback, useState } from "react";
import { VideoPreview, useCallStateHooks, useConnectedUser, createSoundDetector } from "@stream-io/video-react-sdk";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAudioEnabled, setVideoEnabled, setSoundDetected } from "@/store/slices/mediaSlice";
import SpeechIndicator from "./speechIndicator";
import { Mic, MicOff, Video, VideoOff, MoreVertical, Sparkles, Volume2, ChevronDown } from "lucide-react";
import { AudioInputDeviceSelector, AudioOutputDeviceSelector, VideoInputDeviceSelector } from "./deviceSelector";
import DeviceSelectorPopover from "@/components/join/deviceSelectorPopover";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const MeetingPreview: React.FC = () => {
    const user = useConnectedUser();
    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled, isSoundDetected } = useAppSelector((state) => state.media);
    const [videoPreviewText, setVideoPreviewText] = useState("");

    const { useCameraState, useMicrophoneState, useSpeakerState } = useCallStateHooks();
    const { camera, hasBrowserPermission: hasCameraPermission } = useCameraState();
    const { microphone, hasBrowserPermission: hasMicrophonePermission, status: microphoneStatus, mediaStream } = useMicrophoneState();
    const { speaker } = useSpeakerState();

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
        setVideoPreviewText(isVideoEnabled ? "Camera is off" : "Camera is starting");
        camera.toggle().then(() => {
            dispatch(setVideoEnabled(!isVideoEnabled));
            setVideoPreviewText(isVideoEnabled ? "Camera is off" : "");
        });
    }, [camera, dispatch, isVideoEnabled]);

    return (
        <div className="w-full max-w-3xl lg:pr-2 lg:mt-8">
            <div className="relative w-full rounded-lg aspect-video mx-auto shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[#121212]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.4)]" />
                <div className="absolute inset-0 flex items-center justify-center [&_video]:-scale-x-100">
                    <VideoPreview
                        DisabledVideoPreview={() => (
                            <div className="text-2xl text-white">
                                {videoPreviewText || (isVideoEnabled ? "Camera is starting..." : "Camera is off")}
                            </div>
                        )}
                    />
                </div>

                {/* User name with camera and speech indicator*/}
                <div className="absolute left-4 top-4 max-w-[85%] truncate text-white text-sm font-thin flex items-center">
                    <SpeechIndicator isSpeaking={isSoundDetected} isMicrophoneEnabled={microphoneStatus === "enabled"} />
                    <span className="relative mr-2">
                        {user?.name}
                        <span
                            className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${
                                hasCameraPermission ? "bg-green-500" : "bg-red-500"
                            }`}
                        ></span>
                    </span>
                </div>

                {/* Top right controls */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <Sparkles className="w-5 h-5" />
                    </Button>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    <DeviceSelectorPopover
                        icon={
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                                onClick={toggleVideo}
                            >
                                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                            </Button>
                        }
                    >
                        <VideoInputDeviceSelector disabled={!hasCameraPermission} />
                    </DeviceSelectorPopover>

                    <DeviceSelectorPopover
                        icon={
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                                onClick={toggleAudio}
                            >
                                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </Button>
                        }
                    >
                        <AudioInputDeviceSelector disabled={!hasMicrophonePermission} />
                    </DeviceSelectorPopover>

                    <DeviceSelectorPopover
                        icon={
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                                onClick={toggleAudio}
                            >
                                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </Button>
                        }
                    >
                        <AudioOutputDeviceSelector disabled={!hasMicrophonePermission} />
                    </DeviceSelectorPopover>
                </div>

            </div>
        </div>
    );
};

export default MeetingPreview;
