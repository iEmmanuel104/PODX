// pages/pod/index.tsx
"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { StreamVideoClient, ErrorFromResponse, GetCallResponse } from "@stream-io/video-react-sdk";
import { API_KEY, CALL_TYPE } from "@/providers/meetProvider/streamMeetProvider";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { customAlphabet } from "nanoid";
import { AppContext } from "@/providers/appProvider";
import { clearSessionInfo, setSessionInfo } from "@/store/slices/podSlice";
import { sessionType } from "@/constants";
import { updateUser } from "@/store/slices/userSlice";
import { useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame } from "lucide-react";

// Dynamic imports
const CreateSessionModal = dynamic(() => import("@/components/pod/createSessionModal"), { ssr: false });
const CreatedSessionModal = dynamic(() => import("@/components/pod/createdSessionModal"), { ssr: false });
const UserInfoModal = dynamic(() => import("@/components/user/userInfoModal"), { ssr: false });
const Logo = dynamic(() => import("@/components/ui/logo"), { ssr: false });
const UserDetails = dynamic(() => import("@/components/user/userDetails"), {
    ssr: false,
    loading: () => <div className="w-full max-w-2xl h-16 bg-[#1E1E1E] rounded-lg animate-pulse" />,
});
const ScheduledPods = dynamic(() => import("@/components/pod/scheduledPods"), { ssr: false });

// Error Message Component
const ErrorMessage = ({ message, onClear }: { message: string; onClear: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 3000);
        return () => clearTimeout(timer);
    }, [message, onClear]);

    return message ? <div className="text-red-500 text-sm mt-2">{message}</div> : null;
};

// Utility functions
const getMeetingId = () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const nanoid = customAlphabet(alphabet, 4);
    return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

interface SessionData {
    title: string;
    type: sessionType;
    sessionId: string;
    starts_at?: string;
    isScheduled?: boolean;
}

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = React.useContext(AppContext);
    const { isLoggedIn, user } = useAppSelector((state) => state.user);
    const sessionInfo = useAppSelector((state) => state.pod);
    const { wallets } = useWallets();
    const activeWalletAddress = wallets[0]?.address;

    const [state, setState] = useState({
        meetingCode: "",
        error: "",
        inviteLink: "",
        sessionCode: "",
        isJoining: false,
        isJoiningCreated: false,
        isCreateModalOpen: false,
        isCreatedModalOpen: false,
        showUsernameModal: false,
        isOpenDialogue: false,
    });

    useEffect(() => {
        if (isLoggedIn && user?.username?.startsWith("guest-")) {
            setState((prev) => ({ ...prev, showUsernameModal: true }));
        }
    }, [isLoggedIn, user]);

    const handleCreateSession = useCallback(
        async (title: string, type: sessionType, scheduledDate?: Date) => {
            dispatch(clearSessionInfo());
            setNewMeeting(true);
            const newSessionCode = getMeetingId();

            // Create session data object
            const sessionData: SessionData = {
                title,
                type,
                sessionId: newSessionCode,
                isScheduled: !!scheduledDate,
            };

            // Add starts_at if it's a scheduled session
            if (scheduledDate) {
                // Ensure the date is in the future
                const startDate = new Date(Math.max(scheduledDate.getTime(), Date.now() + 60000)); // At least 1 minute in future
                sessionData.starts_at = startDate.toISOString();
            }

            // Update local state
            setState((prev) => ({
                ...prev,
                inviteLink: `https://www.podx.fun/pod/join/${newSessionCode}`,
                sessionCode: newSessionCode,
                isCreateModalOpen: false,
                isCreatedModalOpen: true,
            }));

            // Dispatch to store
            dispatch(setSessionInfo(sessionData));

            // Additional logic for scheduled sessions
            if (scheduledDate) {
                try {
                    // Here you can add any additional logic for scheduled sessions
                    // For example, saving to a database or scheduling notifications
                    console.log("Scheduled session for:", sessionData.starts_at);
                } catch (error) {
                    console.error("Failed to schedule session:", error);
                    // Handle error appropriately
                }
            }
        },
        [dispatch, setNewMeeting]
    );

    const handleJoinSession = useCallback(async () => {
        if (!state.meetingCode) return;

        setState((prev) => ({ ...prev, isJoining: true, error: "" }));
        dispatch(clearSessionInfo());

        try {
            const client = new StreamVideoClient({
                apiKey: API_KEY,
                user: {
                    id: user?.id as string,
                    name: user?.username as string,
                },
                token: user?.streamToken,
            });

            const { calls } = await client.queryCalls({ filter_conditions: { id: state.meetingCode } });

            // log the first call to see if it's the same as the meeting code
            if (calls.length > 0 && calls[0].id === state.meetingCode) {
                const response: GetCallResponse = await calls[0].get();
                if (response.call && state.meetingCode === response.call.custom.sessionId) {
                    dispatch(
                        setSessionInfo({
                            title: response.call.custom.title,
                            type: response.call.custom.type,
                            sessionId: state.meetingCode,
                        })
                    );
                    router.push(`/pod/join/${state.meetingCode}`);
                    return;
                }
            }
        } catch (e: unknown) {
            const err = e as ErrorFromResponse<GetCallResponse>;
            setState((prev) => ({
                ...prev,
                error: err.status === 404 ? "Couldn't find the meeting you're trying to join." : "Failed to join meeting",
            }));
        } finally {
            setState((prev) => ({ ...prev, isJoining: false }));
        }
    }, [state.meetingCode, router, user, dispatch]);

    const handleJoinCreatedSession = useCallback(async () => {
        setState((prev) => ({ ...prev, isJoiningCreated: true }));
        try {
            // Use sessionInfo from the outer scope
            if (sessionInfo.starts_at) {
                const startTime = new Date(sessionInfo.starts_at);
                if (startTime > new Date()) {
                    setState((prev) => ({
                        ...prev,
                        error: "This session hasn't started yet. Please join at the scheduled time.",
                        isJoiningCreated: false,
                    }));
                    return;
                }
            }

            router.push(`/pod/join/${state.sessionCode}`);
        } catch (error) {
            console.error("Failed to join created session:", error);
            setState((prev) => ({
                ...prev,
                error: "Failed to join session. Please try again.",
            }));
        } finally {
            setState((prev) => ({ ...prev, isJoiningCreated: false }));
        }
    }, [router, state.sessionCode, sessionInfo.starts_at]);

    const handleUpdateUsername = useCallback(
        (newUsername: string) => {
            setState((prev) => ({ ...prev, showUsernameModal: false }));
            dispatch(updateUser({ username: newUsername }));
        },
        [dispatch]
    );

    if (!isLoggedIn || !user) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl flex flex-col items-center">
                <React.Suspense fallback={<div className="h-12" />}>
                    <Logo />
                </React.Suspense>

                {/* Session streak dialog */}
                <Dialog open={state.isOpenDialogue} onOpenChange={(open) => setState((prev) => ({ ...prev, isOpenDialogue: open }))}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="mb-8 bg-[#1E1E1E] hover:bg-[#2E2E2E] text-[#A3A3A3] hover:text-white rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 border border-[#2E2E2E]"
                        >
                            <Flame className="w-4 h-4 text-[#FF6B00]" />
                            <span>You have no session streak</span>
                            <span className="ml-1">→</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white border border-[#2E2E2E] p-0 rounded-[10px]">
                        <div className="p-6 flex flex-col items-center gap-4">
                            <Flame className="w-12 h-12 text-[#FF6B00] mb-4" />
                            <DialogTitle className="text-4xl text-center font-bold mb-1">0 day</DialogTitle>
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <DialogHeader>
                                    <DialogDescription className="text-[#A3A3A3] text-lg">Session Streak</DialogDescription>
                                </DialogHeader>
                                <DialogDescription className="text-center text-[#A3A3A3] mb-6">
                                    Session streaks are consecutive daily sessions that are either created or attended.
                                </DialogDescription>
                            </div>
                            <Button
                                className="w-full bg-[#6032F6] hover:bg-[#4C28C4] text-white rounded-[10px] py-2 px-4"
                                onClick={() => setState((prev) => ({ ...prev, isOpenDialogue: false }))}
                            >
                                I understand.
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Main grid container */}
                <div className="w-full flex flex-col md:flex-row gap-6 mb-8 sm:mb-16">
                    {/* Join Session Card */}
                    <div className="flex-1 rounded-[10px] p-6 bg-[#1E1E1E] flex flex-col justify-between" style={{ minHeight: "200px" }}>
                        <div>
                            <h2 className="text-[32px] font-semibold text-white">Join Session</h2>
                            <p className="text-[#A3A3A3] text-sm">Join a meeting instantly and collaborate!</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={state.meetingCode}
                                    onChange={(e) => setState((prev) => ({ ...prev, meetingCode: e.target.value }))}
                                    className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm border-[#3c3c3c] focus-within:border-[#3c3c3c] focus:border-[#3c3c3c] focus:ring-[#3c3c3c] text-white placeholder-[#6C6C6C]"
                                />
                                <Button
                                    onClick={handleJoinSession}
                                    disabled={!state.meetingCode || state.isJoining}
                                    className="bg-[#6032F6] text-white px-8 py-2 rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {state.isJoining ? "Joining..." : "Join"}
                                </Button>
                            </div>
                            <ErrorMessage message={state.error} onClear={() => setState((prev) => ({ ...prev, error: "" }))} />
                        </div>
                    </div>

                    {/* Create Session Card */}
                    <div
                        className="w-full md:w-[42%] rounded-[10px] p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] flex flex-col justify-between"
                        style={{ minHeight: "200px" }}
                    >
                        <div>
                            <Image src="/images/play-add.svg" alt="Create Session" width={32} height={32} className="mb-4" priority />
                            <h2 className="text-[32px] font-semibold text-white">Create Session</h2>
                            <p className="text-[#E9D5FF] text-sm mb-4">
                                Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                            </p>
                        </div>
                        <Button
                            onClick={() => setState((prev) => ({ ...prev, isCreateModalOpen: true }))}
                            className="w-full bg-[#DDB958] hover:bg-[#DDB958] text-black font-semibold py-2 px-4 rounded-[10px] transition-colors duration-300"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scheduled sessions */}
            <ScheduledPods />

            {/* User details section */}
            <UserDetails user={user} activeWalletAddress={activeWalletAddress} />

            {/* Modals */}
            <React.Suspense fallback={null}>
                {state.isCreateModalOpen && (
                    <CreateSessionModal
                        isOpen={state.isCreateModalOpen}
                        onClose={() => setState((prev) => ({ ...prev, isCreateModalOpen: false }))}
                        onCreateSession={handleCreateSession}
                    />
                )}

                {state.isCreatedModalOpen && (
                    <CreatedSessionModal
                        isOpen={state.isCreatedModalOpen}
                        onClose={() => setState((prev) => ({ ...prev, isCreatedModalOpen: false }))}
                        inviteLink={state.inviteLink}
                        sessionCode={state.sessionCode}
                        isJoining={state.isJoiningCreated}
                        onJoinSession={handleJoinCreatedSession}
                        scheduledTime={sessionInfo.starts_at}
                    />
                )}

                {user && state.showUsernameModal && (
                    <UserInfoModal
                        isOpen={state.showUsernameModal}
                        onClose={() => setState((prev) => ({ ...prev, showUsernameModal: false }))}
                        initialUsername={user.username}
                        onUpdate={handleUpdateUsername}
                    />
                )}
            </React.Suspense>
        </div>
    );
}
