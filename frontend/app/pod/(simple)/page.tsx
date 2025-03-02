// app/pod/page.tsx
'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { customAlphabet } from 'nanoid';
import { AppContext } from '@/providers/appProvider';
import { sessionType } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StreamCallData } from '@/components/pod/streamCallData';
import { StreakDialog } from '@/components/pod/streaks';
import { setSessionInfo, clearSessionInfo } from '@/store/pod/slice';
import { updateUser } from '@/store/auth/slice';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import { useScheduledCalls } from '@/hooks/useScheduledCalls';
import { scheduledCallsApiSlice } from '@/store/callStats/scheduledCallsApiSlice';
import { addScheduledSession } from '@/store/scheduleSession/slice';

// Dynamic imports
const CreateSessionModal = dynamic(() => import('@/components/pod/createSessionModal'), {
    ssr: false,
});
const CreatedSessionModal = dynamic(() => import('@/components/pod/createdSessionModal'), {
    ssr: false,
});
const UserOnboardingFlow = dynamic(() => import('@/components/user/userOnboardingFlow'), {
    ssr: false,
});

const ScheduledPods = dynamic(() => import('@/components/pod/scheduledPods'), { ssr: false });

// Error Message Componen
const ErrorMessage = ({ message, onClear }: { message: string; onClear: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 3000);
        return () => clearTimeout(timer);
    }, [message, onClear]);

    return message ? <div className="text-red-500 text-sm mt-2">{message}</div> : null;
};

// Utility functions
const getMeetingId = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const nanoid = customAlphabet(alphabet, 4);
    return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

interface SessionData {
    title: string;
    type: sessionType;
    sessionId: string;
    starts_at?: string;
    isScheduled?: boolean;
    tokenGate?: string[];
}

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = React.useContext(AppContext);
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const sessionInfo = useTypedSelector(state => state.pod);
    const { scheduledSessions, scheduleCall, retrieveCall, deleteCall, isLoading } = useScheduledCalls();

    const [state, setState] = useState({
        meetingCode: '',
        error: '',
        inviteLink: '',
        sessionCode: '',
        isJoining: false,
        isJoiningCreated: false,
        isCreateModalOpen: false,
        isCreatedModalOpen: false,
        showUsernameModal: false,
        isOpenDialogue: false,
        foundSession: undefined as StreamCallData | undefined,
        justScheduledSession: false,
    });

    useEffect(() => {
        if (state.justScheduledSession) {
            dispatch(scheduledCallsApiSlice.endpoints.listUserScheduledCalls.initiate(undefined, { forceRefetch: true }));
            setState(prev => ({ ...prev, justScheduledSession: false }));
        }
    }, [state.justScheduledSession, dispatch]);

    useEffect(() => {
        if (isLoggedIn && user?.username?.startsWith('guest-')) {
            setState(prev => ({ ...prev, showUsernameModal: true }));
        }
    }, [isLoggedIn, user]);

    const handleStreamCall = useCallback(
        (response: StreamCallData) => {
            if (response.id && state.meetingCode === response.custom.sessionId) {
                dispatch(
                    setSessionInfo({
                        title: response.custom.title,
                        type: response.custom.type as sessionType,
                        sessionId: state.meetingCode,
                        starts_at: response.starts_at,
                        tokenGate: response.custom.whitelistedUsers ?? undefined,
                    })
                );
                router.push(`/pod/join/${state.meetingCode}`);
            }
        },
        [dispatch, router, state.meetingCode]
    );

    const handleDeleteSession = useCallback(async (session: StreamCallData) => {
        if (!session.id) {
            setState(prev => ({
                ...prev,
                error: 'Cannot delete this session. Invalid session ID.',
            }));
            return;
        }

        try {
            const result = await deleteCall(session.id);

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    error: '',
                }));

                // Refresh the sessions list after deletion
                dispatch(scheduledCallsApiSlice.endpoints.listUserScheduledCalls.initiate(undefined, { forceRefetch: true }));
            } else {
                setState(prev => ({
                    ...prev,
                    error: result.message || 'Failed to cancel session',
                }));
            }
        } catch (error) {
            console.error('Delete session error:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to cancel session',
            }));
        }
    }, [deleteCall, dispatch]);

    const handleCreateSession = useCallback(
        async (title: string, type: sessionType, scheduledDate?: Date, tokenGate?: string[]) => {
            dispatch(clearSessionInfo());
            setNewMeeting(true);
            const newSessionCode = getMeetingId();

            const sessionData: SessionData = {
                title,
                type,
                sessionId: newSessionCode,
                isScheduled: !!scheduledDate,
                tokenGate,
            };

            if (scheduledDate) {
                const startDate = new Date(Math.max(scheduledDate.getTime(), Date.now() + 60000));
                sessionData.starts_at = startDate.toISOString();

                // Check for time conflicts with existing scheduled sessions
                const hasTimeConflict = scheduledSessions.some(session => {
                    if (!session.starts_at) return false;

                    const existingStartTime = new Date(session.starts_at);
                    const newStartTime = startDate;

                    // Check if sessions are scheduled at exactly the same time
                    return existingStartTime.getTime() === newStartTime.getTime();
                });

                if (hasTimeConflict) {
                    setState(prev => ({
                        ...prev,
                        error: 'Cannot schedule a session at this time. There is already a session scheduled at exactly the same time.',
                    }));
                    return;
                }

                try {
                    const result = await scheduleCall({
                        title,
                        type,
                        sessionId: newSessionCode,
                        starts_at: startDate.toISOString(),
                        tokenGate,
                        scheduledDuration: 60, // Set a default duration of 60 minutes
                    });

                    if (!result.data) {
                        throw new Error('Failed to schedule call');
                    }

                    dispatch(setSessionInfo(sessionData));

                    if (result.data && result.data.data) {
                        dispatch(addScheduledSession(result.data.data));
                    }

                    setState(prev => ({
                        ...prev,
                        inviteLink: `https://www.podx.fun/pod/join/${newSessionCode}`,
                        sessionCode: newSessionCode,
                        isCreateModalOpen: false,
                        isCreatedModalOpen: true,
                        justScheduledSession: true,
                        error: '', // Clear any previous errors
                    }));

                    return;
                } catch (error) {
                    console.error('Failed to schedule call:', error);
                    setState(prev => ({
                        ...prev,
                        error: 'Failed to schedule the call',
                    }));
                    return;
                }
            }

            setState(prev => ({
                ...prev,
                inviteLink: `https://www.podx.fun/pod/join/${newSessionCode}`,
                sessionCode: newSessionCode,
                isCreateModalOpen: false,
                isCreatedModalOpen: true,
            }));

            dispatch(setSessionInfo(sessionData));
        },
        [dispatch, setNewMeeting, scheduleCall, scheduledSessions]
    );

    const handleJoinSession = useCallback(async () => {
        if (!state.meetingCode || !user) return;

        setState(prev => ({ ...prev, isJoining: true, error: '' }));
        dispatch(clearSessionInfo());

        try {
            const { data } = await retrieveCall(state.meetingCode);

            if (data?.call) {
                if (data.source === 'stream') {
                    handleStreamCall(data.call);
                } else {
                    setState(prev => ({ ...prev, foundSession: data.call }));
                }
                return;
            }

            setState(prev => ({
                ...prev,
                error: "Couldn't find the meeting you're trying to join.",
            }));
        } catch (error) {
            console.error('Join session error:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to join meeting',
            }));
        } finally {
            setState(prev => ({ ...prev, isJoining: false }));
        }
    }, [state.meetingCode, user, dispatch, retrieveCall, handleStreamCall]);

    const handleJoinCreatedSession = useCallback(async () => {
        setState(prev => ({ ...prev, isJoiningCreated: true }));
        try {
            router.push(`/pod/join/${state.sessionCode}`);
        } catch (error) {
            console.error('Failed to join created session:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to join session. Please try again.',
            }));
        } finally {
            setState(prev => ({ ...prev, isJoiningCreated: false }));
        }
    }, [state.sessionCode]);

    const handleUpdateUsername = useCallback(
        (newUsername: string) => {
            setState(prev => ({ ...prev, showUsernameModal: false }));
            dispatch(updateUser({ username: newUsername }));
        },
        [dispatch]
    );

    const handleClearFoundSession = useCallback(() => {
        setState(prev => ({ ...prev, foundSession: undefined }));
    }, []);

    if (!isLoggedIn || !user) {
        router.push('/');
        return null;
    }

    return (
        <div className="flex flex-col items-center w-full px-4 sm:px-6 py-4 sm:py-8">
            {/* Main Content Container */}
            <div className="w-full max-w-[720px] mx-auto flex flex-col gap-6 sm:gap-8 pb-12">
                {/* Display error message if present */}
                {state.error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
                        {state.error}
                        <button
                            className="ml-2 text-red-400 hover:text-red-300 font-medium"
                            onClick={() => setState(prev => ({ ...prev, error: '' }))}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Main Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Join Session Card */}
                    <div className="w-full rounded-[20px] p-4 sm:p-6 bg-[#1E1E1E] flex flex-col justify-between transition-all duration-200 h-full">
                        <div className="space-y-2 sm:space-y-3">
                            <h2 className="text-xl sm:text-2xl md:text-[32px] font-semibold text-white leading-tight">
                                Join{' '}
                                <span className="hidden sm:inline">
                                    <br />
                                </span>
                                Session
                            </h2>
                            <p className="text-[#A3A3A3] text-sm sm:text-base">
                                Join a meeting instantly and collaborate!
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row md:items-center gap-3">
                                <Input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={state.meetingCode}
                                    onChange={e =>
                                        setState(prev => ({ ...prev, meetingCode: e.target.value }))
                                    }
                                    className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm border-[#3c3c3c]
                                             focus-within:border-[#3c3c3c] focus:border-[#3c3c3c] focus:ring-[#3c3c3c]
                                             text-white placeholder-[#6C6C6C] transition-all duration-200"
                                />
                                <Button
                                    onClick={handleJoinSession}
                                    disabled={!state.meetingCode || state.isJoining}
                                    className="w-fit sm:w-auto bg-[#6032F6] text-white px-8 py-2.5 rounded-[10px]
                                             hover:bg-[#4C28C4] transition-all duration-200 text-sm font-medium
                                             disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {state.isJoining ? 'Joining...' : 'Join'}
                                </Button>
                            </div>
                            <ErrorMessage
                                message={state.error}
                                onClear={() => setState(prev => ({ ...prev, error: '' }))}
                            />
                        </div>
                    </div>

                    {/* Create Session Card */}
                    <div className="w-full rounded-[20px] p-4 sm:p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] flex flex-col justify-between">
                        <div className="space-y-3">
                            <Image
                                src="/images/play-add.svg"
                                alt="Create Session"
                                width={32}
                                height={32}
                                className="mb-3 sm:mb-4"
                                priority
                            />
                            <h2 className="text-xl sm:text-2xl md:text-[32px] font-semibold text-white leading-tight">
                                Create{' '}
                                <span className="hidden sm:inline">
                                    <br />
                                </span>
                                Session
                            </h2>
                            <p className="text-[#E9D5FF] text-sm sm:text-base">
                                Start a meeting or podcast session in seconds - collaborate, share,
                                and record with ease!
                            </p>
                        </div>

                        <Button
                            onClick={() => setState(prev => ({ ...prev, isCreateModalOpen: true }))}
                            className="mt-4 sm:mt-6 bg-[#DDB958] hover:bg-[#DDB958]/80 text-black font-semibold py-2.5 px-6 rounded-[10px] w-fit"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>

                {/* Session streak dialog */}
                <div className="w-full mt-12 sm:mt-16 md:mt-24">
                    <StreakDialog
                        user={user}
                        onToggleCreateSession={() =>
                            setState(prev => ({
                                ...prev,
                                isCreateModalOpen: true,
                            }))
                        }
                    />
                </div>

                {/* Scheduled sessions */}
                <div className="w-full mb-8 sm:mb-12" id="scheduled-sessions-list">
                    <ScheduledPods
                        sessions={scheduledSessions}
                        foundSession={state.foundSession}
                        onJoinSession={session => {
                            handleStreamCall(session);
                        }}
                        onDeleteSession={handleDeleteSession}
                        currentUserId={user?.id}
                        isLoading={isLoading}
                        onClearFoundSession={handleClearFoundSession}
                    />
                </div>
            </div>

            {/* Modals */}
            <React.Suspense fallback={null}>
                {state.isCreateModalOpen && (
                    <CreateSessionModal
                        isOpen={state.isCreateModalOpen}
                        onClose={() => setState(prev => ({ ...prev, isCreateModalOpen: false }))}
                        onCreateSession={handleCreateSession}
                        scheduledSessions={scheduledSessions}
                    />
                )}

                {state.isCreatedModalOpen && (
                    <CreatedSessionModal
                        isOpen={state.isCreatedModalOpen}
                        onClose={() => setState(prev => ({ ...prev, isCreatedModalOpen: false }))}
                        inviteLink={state.inviteLink}
                        sessionCode={state.sessionCode}
                        isJoining={state.isJoiningCreated}
                        onJoinSession={handleJoinCreatedSession}
                        scheduledTime={sessionInfo.starts_at}
                    />
                )}

                {user && state.showUsernameModal && (
                    <UserOnboardingFlow
                        isOpen={state.showUsernameModal}
                        onClose={() => setState(prev => ({ ...prev, showUsernameModal: false }))}
                        initialUsername={user.username}
                        onUpdate={handleUpdateUsername}
                        firstTimeUser={user.firstTimeUser}
                    />
                )}
            </React.Suspense>
        </div>
    );
}
