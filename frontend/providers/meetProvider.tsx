import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { Call, StreamCall, StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { User as ChatUser, StreamChat } from "stream-chat";
import { Chat, useLastReadData } from "stream-chat-react";
import { useAppSelector } from "@/store/hooks";
import { STREAM_API_KEY } from "@/constants";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";

export const CALL_TYPE = "default";
export const API_KEY = STREAM_API_KEY as string;
export const GUEST_ID = `guest_${nanoid(15)}`;

type MeetProviderProps = {
    meetingId: string;
    children: React.ReactNode;
    language?: string,
};

const MeetProvider: React.FC<MeetProviderProps> = ({ meetingId, children, language = "en" }) => {
    const { user: appUser, isLoggedIn } = useAppSelector((state) => state.user);
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [loading, setLoading] = useState(true);
    const [chatClient, setChatClient] = useState<StreamChat>();
    const [videoClient, setVideoClient] = useState<StreamVideoClient>();
    const [call, setCall] = useState<Call>();

    useEffect(() => {
        const setUpClients = async () => {
            if (isLoggedIn && appUser) {
                console.log("signed in");
                const response = await findOrCreateUser({ walletAddress: appUser.walletAddress });
                const userData = response.data?.data as UserInfo;
                const user = {
                    id: userData.id,
                    name: userData.username,
                    image: userData.displayImage,
                    custom: {
                        walletAddress: userData.walletAddress,
                    },
                };
                const chatUser = {
                    id: userData.id,
                    username: userData.username,
                };
                const token = userData.streamToken;

                const _chatClient = StreamChat.getInstance(API_KEY);
                console.log('chat client found', _chatClient, {token});
                await _chatClient.connectUser(chatUser, token);
                setChatClient(_chatClient);

                const _videoClient = new StreamVideoClient({
                    apiKey: API_KEY,
                    user,
                    token,
                });
                setVideoClient(_videoClient);

                const _call = _videoClient.call(CALL_TYPE, meetingId);
                setCall(_call);

                setLoading(false);
            }
        };

        setUpClients();

        return () => {
            chatClient?.disconnectUser();
            videoClient?.disconnectUser();
        };
    }, [appUser, isLoggedIn, meetingId, findOrCreateUser]);

    if (loading) return <div>Loading...</div>;

    return (
        <Chat client={chatClient!}>
            <StreamVideo client={videoClient!}>
                <StreamCall call={call}>{children}</StreamCall>
            </StreamVideo>
        </Chat>
    );
};

export default MeetProvider;
