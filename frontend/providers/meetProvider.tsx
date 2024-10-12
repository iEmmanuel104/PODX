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

export const CALL_TYPE = "default";
export const API_KEY = STREAM_API_KEY as string;
export const GUEST_ID = `guest_${nanoid(15)}`;

type MeetProviderProps = {
    meetingId: string;
    children: React.ReactNode;
    language?: string;
};

const MeetProvider: React.FC<MeetProviderProps> = ({ meetingId, children, language = "en" }) => {
    const { user: appUser, isLoggedIn } = useAppSelector((state) => state.user);
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
    }, [isLoggedIn, appUser, tokenProvider, connectChatClient, connectVideoClient, router, meetingId]);
    if (loading) return <LoadingOverlay />;

    return (
        <Chat client={chatClientRef.current!}>
            <StreamVideo client={videoClientRef.current!}>
                <StreamCall call={callRef.current!}>{children}</StreamCall>
            </StreamVideo>
        </Chat>
    );
};

export default MeetProvider;
