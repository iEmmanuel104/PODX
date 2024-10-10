"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateSessionModal from "@/components/pod/createSessionModal";
import CreatedSessionModal from "@/components/pod/createdSessionModal";
import Logo from "@/components/ui/logo";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useSocketEmitters } from "@/hooks/useSocketEmitters";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import { useSocket, useSocketInit } from "@/lib/connections/socket";
import { useWebRTC } from "@/lib/connections/webrtc";
import {
    setPodId,
    setLocalTracks,
    updateParticipantTrack,
    addParticipant,
    removeParticipant,
    toggleLocalAudio,
    toggleLocalVideo,
} from "@/store/slices/podSlice";

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [sessionCode, setSessionCode] = useState("");

    const { isLoggedIn, user, signature } = useAppSelector((state) => state.user);
    const { podId, localUser } = useAppSelector((state) => state.pod);
    const { createPod, joinPod, updateLocalTracks, leavePod } = useSocketEmitters();
    const socketListeners = useSocketListeners();

    const [socket, isSocketConnected] = useSocket();
    const initSocket = useSocketInit();
    const { initializeLocalStream, createPeerConnection, addTracks, startCall, handleSignal, toggleAudioTrack, toggleVideoTrack } = useWebRTC();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useMediaPermissions();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/");
        } else if (user && signature) {
            initSocket(signature);
        }

        return () => {
            if (podId) {
                leavePod(podId);
            }
        };
    }, [isLoggedIn, router, user, signature, initSocket, leavePod, podId]);

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

    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);
    const openCreatedModal = () => setIsCreatedModalOpen(true);
    const closeCreatedModal = () => setIsCreatedModalOpen(false);

    const handleCreateSession = useCallback(
        async (title: string, type: string) => {
            try {
                const newPodId = await createPod(title);
                dispatch(setPodId(newPodId));
                setInviteLink(`https://podx.studio/studio/${newPodId}`);
                setSessionCode(newPodId);
                closeCreateModal();
                openCreatedModal();

                const stream = await initializeLocalStream(true, type === "Video Session");
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                const audioTrack = stream.getAudioTracks()[0] || null;
                const videoTrack = stream.getVideoTracks()[0] || null;

                dispatch(
                    setLocalTracks({
                        audioTrackId: audioTrack ? audioTrack.id : null,
                        videoTrackId: videoTrack ? videoTrack.id : null,
                    })
                );
                updateLocalTracks(newPodId, audioTrack ? audioTrack.id : null, videoTrack ? videoTrack.id : null);

                const peerConnection = createPeerConnection(newPodId, (event: RTCTrackEvent) => {
                    dispatch(
                        updateParticipantTrack({
                            userId: newPodId,
                            kind: event.track.kind as "audio" | "video",
                            trackId: event.track.id,
                        })
                    );
                });
                await addTracks(peerConnection, stream);
            } catch (error) {
                console.error("Failed to create session:", error);
            }
        },
        [createPod, dispatch, updateLocalTracks, initializeLocalStream, createPeerConnection, addTracks]
    );

    const handleJoinSession = useCallback(async () => {
        try {
            await joinPod(meetingCode);
            router.push(`/pod/join?code=${meetingCode}`);
        } catch (error) {
            console.error("Failed to join session:", error);
        }
    }, [joinPod, meetingCode, router]);

    if (!isLoggedIn || !user) {
        return null;
    }

    const displayName = user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : user.walletAddress.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl flex flex-col items-center">
                <Logo />

                <div className="flex items-center mb-16">
                    <div className="w-8 h-8 bg-[#6032F6] rounded-full flex items-center justify-center text-xs font-bold mr-2">{initials}</div>
                    <span className="bg-green-500 h-1.5 w-1.5 rounded-full mr-1"></span>
                    <span className="text-[#A3A3A3] text-sm">{displayName}</span>
                </div>

                <div className="w-full flex flex-col md:flex-row gap-6 mb-16">
                    <div className="flex-1 rounded-2xl p-6 bg-[#1E1E1E] flex flex-col justify-between" style={{ minHeight: "200px" }}>
                        <div>
                            <h2 className="text-2xl font-semibold mb-2 text-white">Join Session</h2>
                            <p className="text-[#A3A3A3] text-sm">Join a meeting instantly and collaborate!</p>
                        </div>
                        <div className="flex gap-4 align-baseline">
                            <Input
                                type="text"
                                placeholder="Enter meeting code"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className="flex-1 bg-[#2C2C2C] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                            />
                            <Button
                                onClick={handleJoinSession}
                                className="bg-[#6032F6] text-white px-8 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            >
                                Join
                            </Button>
                        </div>
                    </div>

                    <div
                        className="w-[calc(42%-0.75rem)] rounded-lg p-6 cursor-pointer transition-all duration-300 ease-in-out bg-gradient-to-br from-[#6032F6] to-[#381D90] hover:from-[#4C28C4] hover:to-[#2D1873]"
                        onClick={openCreateModal}
                        style={{ minHeight: "250px" }}
                    >
                        <Image src="/images/play-add.svg" alt="Create Session" width={32} height={32} className="mb-4" />
                        <h2 className="text-2xl font-semibold mb-2 text-white">Create Session</h2>
                        <p className="text-[#E9D5FF] text-sm">
                            Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                        </p>
                    </div>
                </div>
            </div>
            <button className="text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" /> Settings
            </button>

            <video ref={localVideoRef} autoPlay muted className="hidden" />
            <CreateSessionModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onCreateSession={handleCreateSession} />
            <CreatedSessionModal
                isOpen={isCreatedModalOpen}
                onClose={closeCreatedModal}
                inviteLink={inviteLink}
                sessionCode={sessionCode}
                onJoinSession={() => router.push(`/pod/join?code=${sessionCode}`)}
            />
        </div>
    );
}
