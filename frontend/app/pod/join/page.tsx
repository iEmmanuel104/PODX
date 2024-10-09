"use client";

import React, { useState, useEffect, useRef } from "react";
import UserInputForm from "@/components/join/user-input-form";
import WaitingScreen from "@/components/join/waiting-screen";
import Logo from "@/components/ui/logo";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAudioEnabled, setVideoEnabled } from "@/store/slices/mediaSlice";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";

const JoinSession: React.FC = () => {
    const [name, setName] = useState<string>("folajindayo.base.eth");
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState<boolean>(false);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled } = useAppSelector((state) => state.media);

    useMediaPermissions();

    useEffect(() => {
        if (isAudioEnabled && isVideoEnabled) {
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                })
                .catch((error) => {
                    console.error("Error accessing media devices:", error);
                });
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isAudioEnabled, isVideoEnabled]);

    const handleJoinSession = () => {
        setIsWaiting(true);
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            dispatch(setAudioEnabled(audioTrack.enabled));
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            dispatch(setVideoEnabled(videoTrack.enabled));
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>

                <p className="text-center mb-8 text-lg">You are about to join Base Live Build Session</p>

                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    <div className="w-full md:w-1/2 bg-[#1D1D1D] p-3.5 rounded-xl">
                        <div className="bg-[#1E1E1E] rounded-lg overflow-hidden mb-6">
                            <div className="relative aspect-video">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                {!isAudioEnabled && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded-full flex items-center">
                                        Muted
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between px-2">
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
                    {!isWaiting ? (
                        <UserInputForm
                            name={name}
                            setName={setName}
                            isBasenameConfirmed={isBasenameConfirmed}
                            handleJoinSession={handleJoinSession}
                        />
                    ) : (
                        <WaitingScreen />
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinSession;
