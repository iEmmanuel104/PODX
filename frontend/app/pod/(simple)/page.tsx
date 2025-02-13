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

const RetroGrid = dynamic(() => import('@/components/ui/retro-grid'));

const ScheduledPods = dynamic(() => import('@/components/pod/scheduledPods'), { ssr: false });

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
}

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = React.useContext(AppContext);
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const sessionInfo = useTypedSelector(state => state.pod);
    const { scheduledSessions, scheduleCall, retrieveCall, isLoading } = useScheduledCalls();

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
    });

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
                    })
                );
                router.push(`/pod/join/${state.meetingCode}`);
            }
        },
        [dispatch, router, state.meetingCode]
    );

    const handleCreateSession = useCallback(
        async (title: string, type: sessionType, scheduledDate?: Date) => {
            dispatch(clearSessionInfo());
            setNewMeeting(true);
            const newSessionCode = getMeetingId();

            const sessionData: SessionData = {
                title,
                type,
                sessionId: newSessionCode,
                isScheduled: !!scheduledDate,
            };

            if (scheduledDate) {
                const startDate = new Date(Math.max(scheduledDate.getTime(), Date.now() + 60000));
                sessionData.starts_at = startDate.toISOString();

                try {
                    const result = await scheduleCall({
                        title,
                        type,
                        sessionId: newSessionCode,
                        starts_at: startDate.toISOString(),
                    });

                    if (!result.data) {
                        throw new Error('Failed to schedule call');
                    }

                    dispatch(setSessionInfo(sessionData));
                    setState(prev => ({
                        ...prev,
                        isCreateModalOpen: false,
                    }));

                    // Don't redirect for scheduled sessions
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

            // Only set invite link and show created modal for instant sessions
            setState(prev => ({
                ...prev,
                inviteLink: `https://www.podx.fun/pod/join/${newSessionCode}`,
                sessionCode: newSessionCode,
                isCreateModalOpen: false,
                isCreatedModalOpen: true,
            }));

            dispatch(setSessionInfo(sessionData));
        },
        [dispatch, setNewMeeting, scheduleCall]
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
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-180px)] py-6 sm:py-8">
            {/* Main Content Container */}
            <div className="w-full max-w-[720px] mx-auto flex flex-col gap-8">
                {/* Main Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Join Session Card */}
                    <div
                        className="w-full rounded-[20px] p-4 sm:p-6 bg-[#1E1E1E] flex flex-col justify-between 
                                  transition-all duration-200 h-full"
                    >
                        <div>
                            <h2 className="text-2xl sm:text-[32px] font-semibold text-white mb-2">
                                Join
                                <span className="hidden sm:inline">
                                    <br />
                                </span>
                                Session
                            </h2>
                            <p className="text-[#A3A3A3] text-sm">
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
                    <div
                        className="w-full rounded-[20px] p-4 sm:p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] 
                                  flex flex-col justify-between transition-all duration-200 h-full"
                    >
                        <div>
                            <Image
                                src="/images/play-add.svg"
                                alt="Create Session"
                                width={32}
                                height={32}
                                className="mb-4"
                                priority
                            />
                            <h2 className="text-2xl sm:text-[32px] font-semibold text-white">
                                Create{' '}
                                <span className="hidden sm:inline">
                                    <br />
                                </span>
                                Session
                            </h2>
                            <p className="text-[#E9D5FF] text-sm mt-2">
                                Start a meeting or podcast session in seconds - collaborate, share,
                                and record with ease!
                            </p>
                        </div>
                        <Button
                            onClick={() => setState(prev => ({ ...prev, isCreateModalOpen: true }))}
                            className="bg-[#DDB958] hover:bg-[#DDB958] text-black font-semibold 
                                     py-2.5 px-4 rounded-[10px] transition-all duration-200 mt-4 w-fit"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>

                {/* Session streak dialog */}
                <div className="w-full mt-24">
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
                <div className="w-full mb-12 sm:mb-16">
                    <ScheduledPods
                        sessions={scheduledSessions}
                        foundSession={state.foundSession}
                        onJoinSession={sessionId => router.push(`/pod/join/${sessionId}`)}
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

            {/* Background Grid - Moved to bottom of stack */}
            <div className="absolute inset-0 w-full overflow-hidden pointer-events-none">
                <RetroGrid />
            </div>
        </div>
    );
}
