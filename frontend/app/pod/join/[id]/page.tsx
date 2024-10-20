"use client";

import React, { useState, useCallback, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import UserInputForm from "@/components/join/user-input-form";
import WaitingScreen from "@/components/join/waiting-screen";
import Logo from "@/components/ui/logo";
import { useAppSelector } from "@/store/hooks";
import {
    useCall,
    useCallStateHooks,
    CallingState,
    CallParticipantResponse,
    ErrorFromResponse,
    GetCallResponse,
    MemberResponse,
} from "@stream-io/video-react-sdk";
import MeetingPreview from "@/components/meeting/meetingPreview";
import CallParticipants from "@/components/meeting/callParticipants";
import { AppContext } from "@/providers/appProvider";
import { useChatContext } from "stream-chat-react";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";
import Image from "next/image";

interface JoinSessionProps {
    params: {
        id: string;
    };
}

const JoinSession: React.FC<JoinSessionProps> = ({ params }) => {
    const router = useRouter();
    const code = params.id;
    const [name, setName] = useState<string>("");
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState<boolean>(false);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [joining, setJoining] = useState<boolean>(false);
    const [participants, setParticipants] = useState<CallParticipantResponse[] | MemberResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorFetchingMeeting, setErrorFetchingMeeting] = useState<boolean>(false);
    const { sessionTitle, sessionType } = useAppSelector((state) => state.pod);
    const { isLoggedIn, user } = useAppSelector((state) => state.user);
    const { newMeeting, setNewMeeting } = useContext(AppContext);
    const { client: chatClient } = useChatContext();

    const call = useCall();

    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const tokenProvider = useStreamTokenProvider();

    useEffect(() => {
        if (isLoggedIn && user) {
            setName(user.username || "");
            setIsGuest(false);
        } else {
            setIsGuest(true);
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        console.log("from lobby3");
        const leavePreviousCall = async () => {
            if (callingState === CallingState.JOINED) {
                await call?.leave();
            }
        };

        const getCurrentCall = async () => {
            if (call) {
                try {
                    const callData = await call.get();

                    setParticipants(callData.members || []);
                } catch (e) {
                    const err = e as ErrorFromResponse<GetCallResponse>;
                    console.error(err.message);
                    setErrorFetchingMeeting(true);
                }
            }
            setLoading(false);
        };

        const createCall = async () => {
            if (call && user) {
                await call.getOrCreate({
                    data: {
                        members: [{ user_id: user.id, role: "host" }],
                        custom: {
                            sessionId: code,
                            title: sessionTitle || "New Call",
                            type: sessionType || "Video Session",
                        },
                        settings_override: {
                            // audio: {
                            //     mic_default_on: true,
                            //     speaker_default_on: true,
                            //     default_device: "speaker"
                            // },
                            // video: {
                            //     camera_default_on: true,
                            //     target_resolution: {
                            //         width: 640,
                            //         height: 480,
                            //     }
                            // },
                            limits: {
                                max_participants: 20,
                                max_duration_seconds: 3600,
                            },
                        },
                    },
                    members_limit: 20,
                    ...(sessionType === "Audio Session" && { video: false }),
                });

                console.log("call create success");
            }
            setLoading(false);
        };

        const initializeCall = async () => {
            if (!joining && code) {
                await leavePreviousCall();
                if (!user) return;
                if (newMeeting) {
                    await createCall();
                } else {
                    await getCurrentCall();
                }
            }
        };

        initializeCall();
    }, [call, callingState, user, joining, newMeeting, code, sessionTitle, sessionType]);

    useEffect(() => {
        setNewMeeting(newMeeting);
        return () => {
            setNewMeeting(false);
        };
    }, [newMeeting, setNewMeeting]);

    const updateGuestName = useCallback(async () => {
        if (isLoggedIn && user) {
            try {
                await chatClient.disconnectUser();
                await chatClient.connectUser({ id: user.id, name: user.username }, async () => await tokenProvider(user.walletAddress));
            } catch (error) {
                console.error(error);
            }
        }
    }, [isLoggedIn, user, chatClient, tokenProvider]);

    const handleJoinSession = useCallback(async () => {
        console.log("join clicked");
        if (code) {
            setJoining(true);
            if (isLoggedIn && user) {
                await updateGuestName();
            }
            if (callingState !== CallingState.JOINED) {
                await call?.join({
                    data: {
                        members: [{ user_id: user?.id!, role: "guest" }],
                    },
                    ...(sessionType === "Audio Session" && { video: false }),
                });
            }
            router.push(`/pod/${code}`);
        }
    }, [code, isLoggedIn, user, call, callingState, router, updateGuestName, sessionType]);

    const participantsUI = useMemo(() => {
        switch (true) {
            case joining:
                return "You'll join the call in just a moment";
            case participants.length === 0:
                return "No one else is here";
            case participants.length > 0:
                return <CallParticipants participants={participants} />;
            default:
                return null;
        }
    }, [joining, participants]);

    if (errorFetchingMeeting) {
        router.push(`/pod/join/${code}&invalid=true`);
        return null;
    }

    const renderContent = () => {
        if (loading) {
            return (
                <div className="w-full flex justify-center">
                    <WaitingScreen />
                </div>
            );
        }
        if (isGuest && !isBasenameConfirmed) {
            return (
                <UserInputForm
                    name={name}
                    setName={setName}
                    isBasenameConfirmed={isBasenameConfirmed}
                    setIsBasenameConfirmed={setIsBasenameConfirmed}
                    handleJoinSession={handleJoinSession}
                />
            );
        } else {
            return (
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
                    <div className="w-full lg:w-1/2">
                        <MeetingPreview />
                    </div>
                    <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start">
                        <h2 className="text-2xl font-semibold mb-4 text-center lg:text-left">Ready to join?</h2>
                        <div className="w-full text-center lg:text-left">
                            {typeof participantsUI === "string" ? <p>{participantsUI}</p> : participantsUI}
                        </div>
                        <button
                            onClick={handleJoinSession}
                            className="mt-4 w-full max-w-md bg-[#6032F6] text-white px-8 py-3 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-base font-medium flex items-center justify-center"
                            disabled={joining || (isGuest && !name)}
                        >
                            <Image src="/images/join.svg" alt="Join" width={24} height={24} className="mr-2" />
                            {joining ? "Joining..." : "Join session"}
                        </button>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>
                <div className="mb-8 text-lg flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-center">
                    <p className="text-gray-400">You are about to join</p>
                    <p className="text-white">
                        {sessionTitle || "Base Live Build Session"} ({sessionType || "Video Session"})
                    </p>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default JoinSession;
