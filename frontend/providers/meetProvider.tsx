"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import { Call, StreamCall, StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { User as ChatUser, StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import { useAppSelector } from "@/store/hooks";
import { STREAM_API_KEY } from "@/constants";
import { LoadingOverlay } from "@/components/ui/loading";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export const CALL_TYPE = "default";
export const API_KEY = STREAM_API_KEY as string;
export const GUEST_ID = `guest_${nanoid(15)}`;

type MeetProviderProps = {
    meetingId?: string;
    children: React.ReactNode;
    language?: string;
};

const SimpleMeetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

const StreamMeetProvider: React.FC<{ meetingId: string; children: React.ReactNode; language: string }> = ({ meetingId, children, language }) => {
    const { user: appUser, isLoggedIn } = useAppSelector((state) => state.user);
    const { user: privyUser } = usePrivy();
    const [loading, setLoading] = useState(true);
    const chatClientRef = useRef<StreamChat>();
    const videoClientRef = useRef<StreamVideoClient>();
    const callRef = useRef<Call>();
    const tokenProvider = useStreamTokenProvider();
    const router = useRouter();

    const connectChatClient = useCallback(
        async (token: string) => {
            if (!chatClientRef.current) {
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
        console.log("MeetProvider mounted");
        const setupClients = async () => {
            if (isLoggedIn && appUser && privyUser) {
                console.log("Setting up clients for found user:", appUser);
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
                // Store the pending session code in local storage
                if (meetingId) {
                    localStorage.setItem("pendingSessionCode", meetingId);
                }
                // Redirect to login page
                router.push("/");
            }
        };

        setupClients();

        return () => {
            chatClientRef.current?.disconnectUser();
            videoClientRef.current?.disconnectUser();
        };
    }, [isLoggedIn, appUser, privyUser, tokenProvider, connectChatClient, connectVideoClient, router, meetingId]);

    if (loading || !chatClientRef.current || !videoClientRef.current || !callRef.current) {
        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay text="Preparing your meeting space..." />
            </div>
        );
    }

    return (
        <Chat client={chatClientRef.current}>
            <StreamVideo client={videoClientRef.current}>
                <StreamCall call={callRef.current}>{children}</StreamCall>
            </StreamVideo>
        </Chat>
    );
};

const MeetProvider: React.FC<MeetProviderProps> = ({ meetingId, children, language = "en" }) => {
    if (!meetingId) {
        return <SimpleMeetProvider>{children}</SimpleMeetProvider>;
    }

    return (
        <StreamMeetProvider meetingId={meetingId} language={language}>
            {children}
        </StreamMeetProvider>
    );
};

export default MeetProvider;
