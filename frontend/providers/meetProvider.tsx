import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { Call, StreamCall, StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { User as ChatUser, StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import { useAppSelector } from "@/store/hooks";
import { STREAM_API_KEY } from "@/constants";
import { LoadingOverlay } from "@/components/ui/loading";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";

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
    const [chatClient, setChatClient] = useState<StreamChat>();
    const [videoClient, setVideoClient] = useState<StreamVideoClient>();
    const [call, setCall] = useState<Call>();
    const tokenProvider = useStreamTokenProvider();

    useEffect(() => {
        const setUpClients = async () => {
            if (isLoggedIn && appUser) {
                const customProvider = async () => {
                    const token = await tokenProvider(appUser.walletAddress);
                    return token;
                };

                console.log("signed in");
                const user = {
                    id: appUser.id,
                    name: appUser.username,
                    image: appUser.displayImage,
                    custom: {
                        walletAddress: appUser.walletAddress,
                    },
                };
                const chatUser = {
                    id: appUser.id,
                    username: appUser.username,
                };

                const _chatClient = StreamChat.getInstance(API_KEY);
                console.log("chat client found", _chatClient);
                await _chatClient.connectUser(chatUser, customProvider);

                const _videoClient = new StreamVideoClient({
                    apiKey: API_KEY,
                    user,
                    tokenProvider: customProvider,
                });

                const _call = _videoClient.call(CALL_TYPE, meetingId);

                setVideoClient(_videoClient);
                setCall(_call);
                setChatClient(_chatClient);

                setLoading(false);
            }
        };

        setUpClients();

        return () => {
            chatClient?.disconnectUser();
            videoClient?.disconnectUser();
        };
    }, [appUser, isLoggedIn, meetingId, tokenProvider, chatClient, videoClient]);

    if (loading) return <LoadingOverlay />;

    return (
        <Chat client={chatClient!}>
            <StreamVideo client={videoClient!}>
                <StreamCall call={call}>{children}</StreamCall>
            </StreamVideo>
        </Chat>
    );
};

export default MeetProvider;
