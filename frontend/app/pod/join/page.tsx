"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserInputForm from "@/components/join/user-input-form";
import WaitingScreen from "@/components/join/waiting-screen";
import Logo from "@/components/ui/logo";
import { useAppSelector } from "@/store/hooks";
import MeetProvider from "@/providers/meetProvider";
import { useStreamVideoClient, useCall, useCallStateHooks, CallingState, CallParticipantResponse } from "@stream-io/video-react-sdk";
import MeetingPreview from "@/components/meeting/meetingPreview";
import CallParticipants from "@/components/meeting/callParticipants";

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

    const { isLoggedIn, user } = useAppSelector((state) => state.user);

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
        const getCurrentCall = async () => {
            if (call) {
                try {
                    const callData = await call.get();
                    setParticipants(callData?.call?.session?.participants || []);
                } catch (e) {
                    console.error("Error fetching call data:", e);
                }
            }
        };

        if (code && !joining) {
            getCurrentCall();
        }
    }, [call, code, joining]);

    const handleJoinSession = useCallback(async () => {
        if (code) {
            setJoining(true);
            if (isGuest) {
                // Handle guest join request
                console.log("Guest joining session:", name, code);
                // Implement your guest join request logic here
            } else {
                if (callingState !== CallingState.JOINED) {
                    await call?.join();
                }
                router.push(`/pod/meeting?code=${code}`);
            }
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

    const renderContent = () => {
        if (isGuest) {
            return <UserInputForm name={name} setName={setName} isBasenameConfirmed={isBasenameConfirmed} handleJoinSession={handleJoinSession} />;
        } else if (!isWaiting) {
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
                            disabled={joining}
                        >
                            {joining ? "Joining..." : "Join Now"}
                        </button>
                    </div>
                </div>
            );
        } else {
            return <WaitingScreen />;
        }
    };

    return (
        <MeetProvider meetingId={code}>
            <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="flex justify-center mb-8">
                        <Logo />
                    </div>

                    <p className="text-center mb-8 text-lg">You are about to join Base Live Build Session</p>

                    {renderContent()}
                </div>
            </div>
        </MeetProvider>
    );
};

export default JoinSession;
