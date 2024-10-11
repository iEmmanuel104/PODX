"use client";

import React, { useState, useCallback, useEffect, useMemo, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserInputForm from "@/components/join/user-input-form";
import WaitingScreen from "@/components/join/waiting-screen";
import Logo from "@/components/ui/logo";
import { useAppSelector } from "@/store/hooks";
import {
    useStreamVideoClient,
    useCall,
    useCallStateHooks,
    CallingState,
    CallParticipantResponse,
    ErrorFromResponse,
    GetCallResponse,
} from "@stream-io/video-react-sdk";
import MeetingPreview from "@/components/meeting/meetingPreview";
import CallParticipants from "@/components/meeting/callParticipants";
import { AppContext } from "@/providers/AppProvider";
import { useChatContext } from "stream-chat-react";
import { GUEST_ID, tokenProvider } from "@/providers/meetProvider";

const JoinSession: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code") || "";
    const [name, setName] = useState<string>("");
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState<boolean>(false);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [joining, setJoining] = useState<boolean>(false);
    const [participants, setParticipants] = useState<CallParticipantResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorFetchingMeeting, setErrorFetchingMeeting] = useState<boolean>(false);

    const { isLoggedIn, user } = useAppSelector((state) => state.user);
    const { newMeeting, setNewMeeting } = useContext(AppContext);
    const { client: chatClient } = useChatContext();

    const client = useStreamVideoClient();
    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    useEffect(() => {
        if (!isLoggedIn && !user) {
            setIsGuest(true);
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        const leavePreviousCall = async () => {
            if (callingState === CallingState.JOINED) {
                await call?.leave();
            }
        };

        const getCurrentCall = async () => {
            if (call) {
                try {
                    const callData = await call.get();
                    setParticipants(callData?.call?.session?.participants || []);
                } catch (e) {
                    const err = e as ErrorFromResponse<GetCallResponse>;
                    console.error(err.message);
                    setErrorFetchingMeeting(true);
                }
            }
            setLoading(false);
        };

        const createCall = async () => {
            if (call) {
                await call.create({
                    data: {
                        members: [
                            {
                                user_id: user?.id!,
                                role: "host",
                            },
                        ],
                    },
                });
            }
            setLoading(false);
        };

        if (!joining && code) {
            leavePreviousCall();
            if (!user) return;
            if (newMeeting) {
                createCall();
            } else {
                getCurrentCall();
            }
        }
    }, [call, callingState, user, joining, newMeeting, code]);

    useEffect(() => {
        setNewMeeting(newMeeting);
        return () => {
            setNewMeeting(false);
        };
    }, [newMeeting, setNewMeeting]);

    const updateGuestName = async () => {
        try {
            // await fetch("/api/user", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({
            //         user: { id: user?.id, name: name },
            //     }),
            // });
            await chatClient.disconnectUser();
            await chatClient.connectUser(
                {
                    id: GUEST_ID,
                    type: "guest",
                    name: name,
                },
                tokenProvider
            );
        } catch (error) {
            console.error(error);
        }
    };

    const handleJoinSession = useCallback(async () => {
        if (code) {
            setJoining(true);
            if (isGuest) {
                await updateGuestName();
            }
            if (callingState !== CallingState.JOINED) {
                await call?.join();
            }
            router.push(`/pod/${code}`);
        }
    }, [code, isGuest, name, call, callingState, router]);

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
        router.push(`/pod?code=${code}&invalid=true`);
        return null;
    }

    const renderContent = () => {
        if (loading) {
            return <WaitingScreen />;
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
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
                    <div className="w-full md:w-1/2">
                        <MeetingPreview />
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <h2 className="text-2xl font-semibold mb-4">Ready to join?</h2>
                        {participantsUI}
                        <button
                            onClick={handleJoinSession}
                            className="mt-4 w-full bg-[#6032F6] text-white px-8 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            disabled={joining || (isGuest && !name)}
                        >
                            {joining ? "Joining..." : "Join Now"}
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

                <p className="text-center mb-8 text-lg">You are about to join Base Live Build Session</p>

                {renderContent()}
            </div>
        </div>
    );
};

export default JoinSession;
