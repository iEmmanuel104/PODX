"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { STREAM_API_KEY } from "@/constants";
import { LoadingOverlay } from "@/components/ui/loading";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";
import { useRouter } from "next/navigation";
import type { StreamChat } from "stream-chat";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";

// Dynamically import Stream components
const DynamicStreamVideo = dynamic(() => import("@stream-io/video-react-sdk").then((mod) => mod.StreamVideo), { ssr: false });

const DynamicStreamCall = dynamic(() => import("@stream-io/video-react-sdk").then((mod) => mod.StreamCall), { ssr: false });

const DynamicChat = dynamic(() => import("stream-chat-react").then((mod) => mod.Chat), { ssr: false });

export const CALL_TYPE = "default";
export const API_KEY = STREAM_API_KEY as string;
export const GUEST_ID = `guest_${nanoid(15)}`;

type MeetProviderProps = {
    meetingId?: string;
    children: React.ReactNode;
    language?: string;
};

const SimpleMeetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="w-full h-full">{children}</div>;
};

const StreamMeetProvider: React.FC<{ meetingId: string; children: React.ReactNode; language: string }> = ({ meetingId, children, language }) => {
    const { user: appUser, isLoggedIn } = useAppSelector((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const chatClientRef = useRef<StreamChat>();
    const videoClientRef = useRef<StreamVideoClient>();
    const callRef = useRef<Call>();
    const tokenProvider = useStreamTokenProvider();
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const connectChatClient = useCallback(
        async (token: string) => {
            if (!chatClientRef.current) {
                const { StreamChat } = await import("stream-chat");
                chatClientRef.current = StreamChat.getInstance(API_KEY);
            }

            if (!chatClientRef.current.userID) {
                await chatClientRef.current.connectUser(
                    {
                        id: appUser!.id,
                        username: appUser!.username,
                    },
                    token
                );
            }
        },
        [appUser]
    );

    const connectVideoClient = useCallback(
        async (token: string) => {
            if (!videoClientRef.current) {
                const { StreamVideoClient } = await import("@stream-io/video-react-sdk");
                videoClientRef.current = new StreamVideoClient({
                    apiKey: API_KEY,
                    user: {
                        id: appUser!.id,
                        name: appUser!.username,
                        image: appUser!.displayImage,
                        custom: {
                            walletAddress: appUser!.walletAddress,
                        },
                    },
                    tokenProvider: async () => token,
                });
            }

            if (!callRef.current) {
                callRef.current = videoClientRef.current.call(CALL_TYPE, meetingId);
            }
        },
        [appUser, meetingId]
    );

    useEffect(() => {
        if (!isMounted) return;

        const setupClients = async () => {
            if (isLoggedIn && appUser) {
                try {
                    const token = await tokenProvider(appUser.walletAddress);
                    await connectChatClient(token);
                    await connectVideoClient(token);
                    setLoading(false);
                } catch (error) {
                    console.error("Error setting up clients:", error);
                    setLoading(false);
                }
            } else {
                if (meetingId) {
                    localStorage.setItem("pendingSessionCode", meetingId);
                }
                router.push("/");
            }
        };

        setupClients();

        return () => {
            chatClientRef.current?.disconnectUser();
            videoClientRef.current?.disconnectUser();
        };
    }, [isMounted, isLoggedIn, appUser, tokenProvider, connectChatClient, connectVideoClient, router, meetingId]);

    if (!isMounted || loading || !chatClientRef.current || !videoClientRef.current || !callRef.current) {
        return (
            <div className="w-full h-full">
                <LoadingOverlay text="Preparing your meeting space..." />
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <DynamicChat client={chatClientRef.current}>
                <DynamicStreamVideo client={videoClientRef.current}>
                    <DynamicStreamCall call={callRef.current}>{children}</DynamicStreamCall>
                </DynamicStreamVideo>
            </DynamicChat>
        </div>
    );
};

const MeetProvider: React.FC<MeetProviderProps> = ({ meetingId, children, language = "en" }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-full">{children}</div>;
    }

    return (
        <div className="w-full h-full">
            {!meetingId ? (
                <SimpleMeetProvider>{children}</SimpleMeetProvider>
            ) : (
                <StreamMeetProvider meetingId={meetingId} language={language}>
                    {children}
                </StreamMeetProvider>
            )}
        </div>
    );
};

export default MeetProvider;
