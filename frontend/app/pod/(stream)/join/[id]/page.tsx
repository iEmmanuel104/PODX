'use client';
import React, { useState, useCallback, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    useCall,
    useCallStateHooks,
    CallingState,
    type CallParticipantResponse,
    type ErrorFromResponse,
    type GetCallResponse,
} from '@stream-io/video-react-sdk';
// import { useChatContext } from 'stream-chat-react';
// import { useStreamTokenProvider } from '@/hooks/useStreamTokenProvider';
import Image from 'next/image';
import toast from 'react-hot-toast';
// import { useContext } from 'react';
// import { AppContext } from '@/providers/appProvider';
import { setSessionInfo, resetMeetingState } from '@/store/slices/podSlice';
import { useScheduledCalls } from '@/hooks/useScheduledCalls';
import { sessionType } from '@/constants';

// Types
interface JoinSessionProps {
    params: {
        id: string;
    };
}

interface JoinSessionState {
    name: string;
    joining: boolean;
    loading: boolean;
    showScheduledDialog: boolean;
    scheduledMeetData: {
        title: string;
        startTime: string;
        creator?: {
            id: string;
            name: string;
            username: string;
        };
        type: string;
        sessionId: string;
        createdAt: string;
    } | null;
}

// Components
const SimpleLoader = () => (
    <div className="flex items-center justify-center w-full h-full min-h-[180px] sm:min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white" />
    </div>
);

// Lazy load components with reduced bundle size
const WaitingScreen = React.lazy(() =>
    import('@/components/join/waiting-screen').then(mod => ({
        default: mod.default,
    }))
);

const Logo = React.lazy(() =>
    import('@/components/ui/logo').then(mod => ({
        default: mod.default,
    }))
);

const MeetingPreview = React.lazy(() =>
    import('@/components/meeting/meetingPreview').then(mod => ({
        default: mod.default,
    }))
);

const CallParticipants = React.lazy(() =>
    import('@/components/meeting/callParticipants').then(mod => ({
        default: mod.default,
    }))
);

const ScheduledMeetDialog = React.lazy(() =>
    import('@/components/join/scheduledMeetDialog').then(mod => ({
        default: mod.default,
    }))
);

// Separate component for the join button to prevent unnecessary re-renders
const JoinButton = React.memo(
    ({
        onJoin,
        isJoining,
        isDisabled,
    }: {
        onJoin: () => void;
        isJoining: boolean;
        isDisabled: boolean;
    }) => (
        <button
            onClick={onJoin}
            className="mt-4 w-full max-w-sm sm:max-w-md bg-[#6032F6] text-white px-4 sm:px-8 py-2.5 sm:py-3 
                   rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out 
                   text-sm sm:text-base font-medium flex items-center justify-center
                   disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isJoining || isDisabled}
        >
            <Image
                src="/images/join.svg"
                alt="Join"
                width={20}
                height={20}
                className="mr-2 w-5 h-5 sm:w-6 sm:h-6"
                priority
            />
            {isJoining ? 'Joining...' : 'Join session'}
        </button>
    )
);

JoinButton.displayName = 'JoinButton';

// Main Component
const JoinSession: React.FC<JoinSessionProps> = ({ params }) => {
    const router = useRouter();
    const code = params.id;
    const dispatch = useAppDispatch();
    const { getCall } = useScheduledCalls();
    const hasCheckedSchedule = useRef(false);

    // State
    const [state, setState] = useState<JoinSessionState>({
        name: '',
        joining: false,
        loading: true,
        showScheduledDialog: false,
        scheduledMeetData: null,
    });
    const [participants, setParticipants] = useState<CallParticipantResponse[]>([]);

    // Selectors
    const { sessionTitle, sessionType, isScheduled, starts_at } = useAppSelector(
        state => state.pod
    );
    const isNewMeeting = useAppSelector(state => state.pod.isNewMeeting);
    const { isLoggedIn, user } = useAppSelector(state => state.user);

    // Stream Video Hooks
    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    // Check scheduled meeting
    const checkScheduledMeeting = useCallback(async () => {
        if (!code || !user || hasCheckedSchedule.current) return;
        hasCheckedSchedule.current = true;

        try {
            const response = await getCall(code);

            if (response.status === 'success' && response.data?.call) {
                if (response.data.source === 'scheduled') {
                    const { call } = response.data;
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        showScheduledDialog: true,
                        scheduledMeetData: {
                            title: call.custom.title,
                            startTime: call.starts_at,
                            creator: call.created_by
                                ? {
                                      id: call.created_by.id,
                                      name: call.created_by.name || 'Unknown',
                                      username:
                                          call.created_by.custom?.username ||
                                          call.created_by.name ||
                                          'Unknown',
                                  }
                                : undefined,
                            type: call.custom.type,
                            sessionId: call.custom.sessionId,
                            createdAt: call.created_at,
                        },
                    }));
                } else {
                    // Set session info from existing call
                    dispatch(
                        setSessionInfo({
                            title: response.data.call.custom.title,
                            type: response.data.call.custom.type as sessionType,
                            sessionId: code,
                        })
                    );
                    setState(prev => ({ ...prev, loading: false }));
                }
            } else {
                setState(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error('Error checking scheduled meeting:', error);
            setState(prev => ({ ...prev, loading: false }));
            toast.error('Error checking meeting status');
        }
    }, [code, user, getCall, dispatch]);

    // Initialize call effect
    useEffect(() => {
        if (!state.loading || state.showScheduledDialog) return;

        const init = async () => {
            try {
                if (callingState === CallingState.JOINED) {
                    await call?.leave();
                }

                if (!state.showScheduledDialog) {
                    if (isNewMeeting) {
                        await call?.getOrCreate({
                            data: {
                                members: [{ user_id: user?.id!, role: 'host' }],
                                custom: {
                                    sessionId: code,
                                    title: sessionTitle || 'New Call',
                                    type: sessionType || 'Video Session',
                                },
                                settings_override: {
                                    limits: {
                                        max_participants: 20,
                                        max_duration_seconds: 3600,
                                    },
                                },
                                ...(isScheduled && { starts_at }),
                            },
                            members_limit: 20,
                            ...(sessionType === 'Audio Session' && { video: false }),
                        });
                    } else {
                        const callData = await call?.get();
                        if (callData?.call) {
                            setParticipants(callData.call.session?.participants || []);
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing call:', error);
                toast.error('Error initializing meeting');
                router.push('/pod');
            }
        };

        init();
    }, [
        state.loading,
        state.showScheduledDialog,
        call,
        callingState,
        code,
        isNewMeeting,
        sessionTitle,
        sessionType,
        isScheduled,
        starts_at,
        user,
    ]);

    // Effects
    useEffect(() => {
        if (isLoggedIn && user) {
            setState(prev => ({
                ...prev,
                name: user.username || '',
            }));
        }
    }, [isLoggedIn, user]);

    // Main initialization and cleanup effect
    useEffect(() => {
        checkScheduledMeeting();

        return () => {
            dispatch(resetMeetingState());
            hasCheckedSchedule.current = false;
        };
    }, [dispatch, checkScheduledMeeting]);

    // Join session handler
    const handleJoinSession = useCallback(async () => {
        if (!code) return;

        setState(prev => ({ ...prev, joining: true }));

        try {
            if (callingState !== CallingState.JOINED) {
                await call?.join({
                    data: {
                        members: [{ user_id: user?.id! }],
                    },
                    ...(sessionType === 'Audio Session' && { video: false }),
                });
                await call?.updateCallMembers({ update_members: [{ user_id: user?.id! }] });
            }

            router.push(`/pod/${code}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to join session, please check your connection and try again');
            setState(prev => ({ ...prev, joining: false }));
        }
    }, [code, user, call, callingState, router, sessionType]);

    // Memoized UI elements
    const participantsUI = useMemo(() => {
        if (state.joining) return "You'll join the call in just a moment";
        if (participants.length === 0) return 'No one else is here';
        return (
            <Suspense fallback={<SimpleLoader />}>
                <CallParticipants participants={participants} />
            </Suspense>
        );
    }, [state.joining, participants]);

    // Render conditions
    if (state.showScheduledDialog && state.scheduledMeetData) {
        return (
            <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
                <Suspense fallback={<SimpleLoader />}>
                    <ScheduledMeetDialog
                        isOpen={true}
                        onClose={() => router.push('/pod')}
                        sessionTitle={state.scheduledMeetData.title}
                        startTime={state.scheduledMeetData.startTime}
                        creator={state.scheduledMeetData.creator}
                        type={state.scheduledMeetData.type}
                        sessionId={state.scheduledMeetData.sessionId}
                        createdAt={state.scheduledMeetData.createdAt}
                    />
                </Suspense>
            </div>
        );
    }

    if (state.loading) {
        return (
            <Suspense fallback={<SimpleLoader />}>
                <WaitingScreen />
            </Suspense>
        );
    }

    return (
        <div className="min-h-screen bg-[#151515] text-white">
            <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 flex flex-col min-h-screen">
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Suspense fallback={<SimpleLoader />}>
                        <div className="w-32 sm:w-40 md:w-48 mb-6 sm:mb-8">
                            <Logo />
                        </div>
                    </Suspense>

                    <div className="mb-6 sm:mb-8 text-center space-y-2">
                        <p className="text-gray-400 text-sm sm:text-base">You are about to join</p>
                        <p className="text-white text-base sm:text-lg md:text-xl font-medium">
                            {sessionTitle || 'Base Live Build Session'}
                            <span className="text-gray-400">
                                ({sessionType || 'Video Session'})
                            </span>
                        </p>
                    </div>

                    <div className="w-full max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            <div className="w-full">
                                <Suspense fallback={<SimpleLoader />}>
                                    <MeetingPreview />
                                </Suspense>
                            </div>

                            <div className="w-full flex flex-col items-center lg:items-start justify-center space-y-4 sm:space-y-6">
                                <h2 className="text-xl sm:text-2xl font-semibold text-center lg:text-left">
                                    Ready to join?
                                </h2>
                                <div className="w-full text-center lg:text-left text-sm sm:text-base">
                                    {participantsUI}
                                </div>
                                <JoinButton
                                    onJoin={handleJoinSession}
                                    isJoining={state.joining}
                                    isDisabled={!state.name}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinSession;
