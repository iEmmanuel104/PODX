"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import UserInputForm from "@/components/join/user-input-form";
import WaitingScreen from "@/components/join/waiting-screen";
import Logo from "@/components/ui/logo";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAudioEnabled, setVideoEnabled } from "@/store/slices/mediaSlice";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useSocketEmitters } from "@/hooks/useSocketEmitters";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import { useSocket, useSocketInit } from "@/lib/connections/socket";
import { useWebRTC } from "@/lib/connections/webrtc";
import { setPodId, setLocalTracks, updateParticipantTrack, addParticipant, removeParticipant } from "@/store/slices/podSlice";

const JoinSession: React.FC = () => {
    const router = useRouter();
    const { code } = router.query;
    const [name, setName] = useState<string>("");
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState<boolean>(false);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled } = useAppSelector((state) => state.media);
    const { isLoggedIn, user, signature } = useAppSelector((state) => state.user);
    const { joinPod, updateLocalTracks, leavePod } = useSocketEmitters();
    const socketListeners = useSocketListeners();

    const [socket, isSocketConnected] = useSocket();
    const initSocket = useSocketInit();
    const { initializeLocalStream, createPeerConnection, addTracks, startCall, handleSignal, toggleAudioTrack, toggleVideoTrack } = useWebRTC();

    useMediaPermissions();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/");
        } else if (user && signature && code) {
            initSocket(signature);
        }

        return () => {
            if (code) {
                leavePod(code as string);
            }
        };
    }, [isLoggedIn, router, user, signature, initSocket, leavePod, code]);

    useEffect(() => {
        if (socket && isSocketConnected) {
            socket.on("signal", ({ from, signal }) => {
                handleSignal(from, signal, (event: RTCTrackEvent) => {
                    console.log("Received track", event.track.kind, "from", from);
                    dispatch(
                        updateParticipantTrack({
                            userId: from,
                            kind: event.track.kind as "audio" | "video",
                            trackId: event.track.id,
                        })
                    );
                });
            });

            socket.on("user-joined", ({ userId, socketId }) => {
                dispatch(addParticipant({ userId, socketId }));
                startCall(userId, (event: RTCTrackEvent) => {
                    dispatch(
                        updateParticipantTrack({
                            userId,
                            kind: event.track.kind as "audio" | "video",
                            trackId: event.track.id,
                        })
                    );
                });
            });

            socket.on("user-left", ({ userId }) => {
                dispatch(removeParticipant(userId));
            });
        }
    }, [socket, isSocketConnected, dispatch, handleSignal, startCall]);

    useEffect(() => {
        const initStream = async () => {
            if (isAudioEnabled && isVideoEnabled) {
                try {
                    const mediaStream = await initializeLocalStream(isAudioEnabled, isVideoEnabled);
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (error) {
                    console.error("Error accessing media devices:", error);
                }
            }
        };

        initStream();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isAudioEnabled, isVideoEnabled, initializeLocalStream]);

    const handleJoinSession = useCallback(async () => {
        if (code && stream) {
            try {
                await joinPod(code as string);
                dispatch(setPodId(code as string));

                const audioTrack = stream.getAudioTracks()[0] || null;
                const videoTrack = stream.getVideoTracks()[0] || null;

                dispatch(
                    setLocalTracks({
                        audioTrackId: audioTrack ? audioTrack.id : null,
                        videoTrackId: videoTrack ? videoTrack.id : null,
                    })
                );
                updateLocalTracks(code as string, audioTrack ? audioTrack.id : null, videoTrack ? videoTrack.id : null);

                const peerConnection = createPeerConnection(code as string, (event: RTCTrackEvent) => {
                    dispatch(
                        updateParticipantTrack({
                            userId: code as string,
                            kind: event.track.kind as "audio" | "video",
                            trackId: event.track.id,
                        })
                    );
                });
                await addTracks(peerConnection, stream);

                setIsWaiting(true);
            } catch (error) {
                console.error("Failed to join session:", error);
            }
        }
    }, [code, stream, joinPod, dispatch, updateLocalTracks, createPeerConnection, addTracks]);

    const toggleAudio = useCallback(() => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            dispatch(setAudioEnabled(audioTrack.enabled));
            toggleAudioTrack(audioTrack.enabled);
        }
    }, [stream, dispatch, toggleAudioTrack]);

    const toggleVideo = useCallback(() => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            dispatch(setVideoEnabled(videoTrack.enabled));
            toggleVideoTrack(videoTrack.enabled);
        }
    }, [stream, dispatch, toggleVideoTrack]);

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
