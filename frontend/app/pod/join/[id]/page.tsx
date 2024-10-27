"use client";
import React, { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    useCall,
    useCallStateHooks,
    CallingState,
    type CallParticipantResponse,
    type ErrorFromResponse,
    type GetCallResponse,
    type MemberResponse,
} from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";
import Image from "next/image";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AppContext } from "@/providers/appProvider";
import { setSessionInfo } from "@/store/slices/podSlice";

// Lightweight loading component to avoid dynamic import overhead
const SimpleLoader = () => (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
    </div>
);

// Lazy load components with reduced bundle size
const UserInputForm = React.lazy(() =>
    import("@/components/join/user-input-form").then((mod) => ({
        default: mod.default,
    }))
);

const WaitingScreen = React.lazy(() =>
    import("@/components/join/waiting-screen").then((mod) => ({
        default: mod.default,
    }))
);

const Logo = React.lazy(() =>
    import("@/components/ui/logo").then((mod) => ({
        default: mod.default,
    }))
);

const MeetingPreview = React.lazy(() =>
    import("@/components/meeting/meetingPreview").then((mod) => ({
        default: mod.default,
    }))
);

const CallParticipants = React.lazy(() =>
    import("@/components/meeting/callParticipants").then((mod) => ({
        default: mod.default,
    }))
);

// Separate component for the join button to prevent unnecessary re-renders
const JoinButton = React.memo(({ onJoin, isJoining, isDisabled }: { onJoin: () => void; isJoining: boolean; isDisabled: boolean }) => (
    <button
        onClick={onJoin}
        className="mt-4 w-full max-w-md bg-[#6032F6] text-white px-8 py-3 rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-base font-medium flex items-center justify-center"
        disabled={isJoining || isDisabled}
    >
        <Image src="/images/join.svg" alt="Join" width={24} height={24} className="mr-2" priority />
        {isJoining ? "Joining..." : "Join session"}
    </button>
));

JoinButton.displayName = "JoinButton";

interface JoinSessionProps {
    params: {
        id: string;
    };
}

interface JoinSessionState {
    name: string;
    isBasenameConfirmed: boolean;
    isGuest: boolean;
    joining: boolean;
    loading: boolean;
}

const JoinSession: React.FC<JoinSessionProps> = ({ params }) => {
    const router = useRouter();
    const code = params.id;
    const dispatch = useAppDispatch();

    // Combined state object to reduce re-renders
    const [state, setState] = useState<JoinSessionState>({
        name: "",
        isBasenameConfirmed: false,
        isGuest: false,
        joining: false,
        loading: true,
    });

    const [participants, setParticipants] = useState<CallParticipantResponse[] | MemberResponse[]>([]);

    // Memoized selectors
    const { sessionTitle, sessionType } = useAppSelector((state) => state.pod);
    const { isLoggedIn, user } = useAppSelector((state) => state.user);
    const { newMeeting, setNewMeeting } = useContext(AppContext);
    const { client: chatClient } = useChatContext();

    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const tokenProvider = useStreamTokenProvider();

    // Initialize user data
    useEffect(() => {
        if (isLoggedIn && user) {
            setState((prev) => ({
                ...prev,
                name: user.username || "",
                isGuest: false,
            }));
        } else {
            setState((prev) => ({
                ...prev,
                isGuest: true,
            }));
        }
    }, [isLoggedIn, user]);

    // Optimized call initialization
    const initializeCall = useCallback(async () => {
        if (state.joining || !code || !user) return;

        if (callingState === CallingState.JOINED) {
            await call?.leave();
        }

        try {
            if (newMeeting) {
                await call?.getOrCreate({
                    data: {
                        members: [{ user_id: user.id, role: "host" }],
                        custom: {
                            sessionId: code,
                            title: sessionTitle || "New Call",
                            type: sessionType || "Video Session",
                        },
                        settings_override: {
                            limits: {
                                max_participants: 20,
                                max_duration_seconds: 3600,
                            },
                        },
                    },
                    members_limit: 20,
                    ...(sessionType === "Audio Session" && { video: false }),
                });
            } else {
                const callData = await call?.get();
                setParticipants(callData?.members || []);
                dispatch(
                    setSessionInfo({
                        title: callData?.call?.custom.title,
                        type: callData?.call?.custom.type,
                        sessionId: code,
                    })
                );
            }
        } catch (e) {
            const err = e as ErrorFromResponse<GetCallResponse>;
            console.error(err.message);
            router.push("/pod");
            toast.error("Error fetching meeting");
        }

        setState((prev) => ({ ...prev, loading: false }));
    }, [call, callingState, user, state.joining, newMeeting, code, sessionTitle, sessionType, router, dispatch]);

    useEffect(() => {
        initializeCall();
    }, [initializeCall]);

    // Cleanup effect
    useEffect(() => {
        setNewMeeting(newMeeting);
        return () => {
            setNewMeeting(false);
        };
    }, [newMeeting, setNewMeeting]);

    // Optimized guest name update
    const updateGuestName = useCallback(async () => {
        if (isLoggedIn && user) {
            try {
                await chatClient.disconnectUser();
                await chatClient.connectUser({ id: user.id, name: user.username }, () => tokenProvider(user.walletAddress));
            } catch (error) {
                console.error(error);
            }
        }
    }, [isLoggedIn, user, chatClient, tokenProvider]);

    // Optimized join session handler
    const handleJoinSession = useCallback(async () => {
        if (!code) return;

        setState((prev) => ({ ...prev, joining: true }));

        try {
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
        } catch (error) {
            console.error(error);
            toast.error("Failed to join session");
            setState((prev) => ({ ...prev, joining: false }));
        }
    }, [code, isLoggedIn, user, call, callingState, router, updateGuestName, sessionType]);

    const handleNameChange = useCallback<React.Dispatch<React.SetStateAction<string>>>((value) => {
        setState((prev) => ({
            ...prev,
            name: typeof value === "function" ? value(prev.name) : value,
        }));
    }, []);

    // Memoized participants UI
    const participantsUI = useMemo(() => {
        if (state.joining) return "You'll join the call in just a moment";
        if (participants.length === 0) return "No one else is here";
        return (
            <Suspense fallback={<SimpleLoader />}>
                <CallParticipants participants={participants} />
            </Suspense>
        );
    }, [state.joining, participants]);

    if (state.loading) {
        return (
            <Suspense fallback={<SimpleLoader />}>
                <WaitingScreen />
            </Suspense>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <Suspense fallback={<SimpleLoader />}>
                    <div className="flex justify-center mb-8">
                        <Logo />
                    </div>
                </Suspense>

                <div className="mb-8 text-lg flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-center">
                    <p className="text-gray-400">You are about to join</p>
                    <p className="text-white">
                        {sessionTitle || "Base Live Build Session"} ({sessionType || "Video Session"})
                    </p>
                </div>

                {state.isGuest && !state.isBasenameConfirmed ? (
                    <Suspense fallback={<SimpleLoader />}>
                        <UserInputForm
                            name={state.name}
                            setName={handleNameChange}
                            isBasenameConfirmed={state.isBasenameConfirmed}
                            setIsBasenameConfirmed={(confirmed: boolean) =>
                                setState((prev) => ({
                                    ...prev,
                                    isBasenameConfirmed: confirmed,
                                }))
                            }
                            handleJoinSession={handleJoinSession}
                        />
                    </Suspense>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
                        <div className="w-full lg:w-1/2">
                            <Suspense fallback={<SimpleLoader />}>
                                <MeetingPreview />
                            </Suspense>
                        </div>
                        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start">
                            <h2 className="text-2xl font-semibold mb-4 text-center lg:text-left">Ready to join?</h2>
                            <div className="w-full text-center lg:text-left">{participantsUI}</div>
                            <JoinButton onJoin={handleJoinSession} isJoining={state.joining} isDisabled={state.isGuest && !state.name} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinSession;
