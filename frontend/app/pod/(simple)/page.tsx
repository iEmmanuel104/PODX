// app/pod/page.tsx
'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { StreamVideoClient, GetCallResponse } from '@stream-io/video-react-sdk';
import { STREAM_API_KEY } from '@/constants';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { customAlphabet } from 'nanoid';
import { AppContext } from '@/providers/appProvider';
import { clearSessionInfo, setSessionInfo } from '@/store/slices/podSlice';
import { sessionType } from '@/constants';
import { updateUser } from '@/store/slices/userSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScheduledCalls } from '@/hooks/useScheduledCalls';
import { StreamCallData } from '@/components/pod/streamCallData';
import { useStreamTokenProvider } from '@/hooks/useStreamTokenProvider';
import Telegram from '@/public/icons/socials/Telegram';
import X from '@/public/icons/socials/X';
import Farcaster from '@/public/icons/socials/Farcaster';
import Link from 'next/link';
import { StreakDialog } from '@/components/pod/streaks';

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

const UserDetails = dynamic(() => import('@/components/user/userDetails'), {
    ssr: false,
    loading: () => <div className="w-full max-w-2xl h-16 bg-[#1E1E1E] rounded-lg animate-pulse" />,
});
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
    const { isLoggedIn, user } = useAppSelector(state => state.user);
    const sessionInfo = useAppSelector(state => state.pod);
    const { scheduledSessions, scheduleCall, getScheduledCall, isLoading } = useScheduledCalls();
    const tokenProvider = useStreamTokenProvider();

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
        (response: GetCallResponse) => {
            if (response.call && state.meetingCode === response.call.custom.sessionId) {
                dispatch(
                    setSessionInfo({
                        title: response.call.custom.title,
                        type: response.call.custom.type,
                        sessionId: state.meetingCode,
                        starts_at: response.call.starts_at,
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
            const token = await tokenProvider(user.walletAddress);

            // First try Stream.io
            const client = new StreamVideoClient({
                apiKey: STREAM_API_KEY,
                user: {
                    id: user.id,
                    name: user.username,
                },
                tokenProvider: async () => token,
            });

            try {
                console.log('Checking Stream.io for call');
                const { calls } = await client.queryCalls({
                    filter_conditions: { id: state.meetingCode },
                });

                if (calls.length > 0 && calls[0].id === state.meetingCode) {
                    console.log('Call found in Stream.io');
                    const response: GetCallResponse = await calls[0].get();
                    handleStreamCall(response);
                    return;
                }
            } catch (streamError) {
                console.log('Stream.io call not found, checking scheduled calls...');
            }

            // Then check Redis scheduled calls
            try {
                console.log('checking server for scheduled call');
                const { data } = await getScheduledCall(state.meetingCode);

                if (data?.call) {
                    setState(prev => ({ ...prev, foundSession: data.call }));
                    return;
                }
            } catch (redisError) {
                console.log('Scheduled call not found in Server');
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
    }, [state.meetingCode, user, dispatch, tokenProvider, handleStreamCall, getScheduledCall]);

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
        <div className="min-h-screen bg-[#151515] text-white flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl flex flex-col items-center">
                {/* User details section */}
                <React.Suspense fallback={<div className="h-12 mb-24" />}>
                    <UserDetails user={user} />
                </React.Suspense>

                {/* Main grid container */}
                <div className="w-full flex flex-col md:flex-row gap-6 mb-8 sm:mb-16">
                    {/* Join Session Card */}
                    <div
                        className="flex-1 rounded-[10px] p-6 bg-[#1E1E1E] flex flex-col justify-between"
                        style={{ minHeight: '200px' }}
                    >
                        <div>
                            <h2 className="text-[32px] font-semibold text-white">Join Session</h2>
                            <p className="text-[#A3A3A3] text-sm">
                                Join a meeting instantly and collaborate!
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={state.meetingCode}
                                    onChange={e =>
                                        setState(prev => ({ ...prev, meetingCode: e.target.value }))
                                    }
                                    className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm border-[#3c3c3c] focus-within:border-[#3c3c3c] focus:border-[#3c3c3c] focus:ring-[#3c3c3c] text-white placeholder-[#6C6C6C]"
                                />
                                <Button
                                    onClick={handleJoinSession}
                                    disabled={!state.meetingCode || state.isJoining}
                                    className="bg-[#6032F6] text-white px-8 py-2 rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
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
                        className="w-full md:w-[42%] rounded-[10px] p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] flex flex-col justify-between"
                        style={{ minHeight: '200px' }}
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
                            <h2 className="text-[32px] font-semibold text-white">Create Session</h2>
                            <p className="text-[#E9D5FF] text-sm mb-4">
                                Start a meeting or podcast session in seconds - collaborate, share,
                                and record with ease!
                            </p>
                        </div>
                        <Button
                            onClick={() => setState(prev => ({ ...prev, isCreateModalOpen: true }))}
                            className="w-full bg-[#DDB958] hover:bg-[#DDB958] text-black font-semibold py-2 px-4 rounded-[10px] transition-colors duration-300"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>

                {/* Session streak dialog */}
                <StreakDialog streak={3} />
            </div>

            {/* Scheduled sessions */}
            <ScheduledPods
                sessions={scheduledSessions}
                foundSession={state.foundSession}
                onJoinSession={sessionId => router.push(`/pod/join/${sessionId}`)}
                currentUserId={user?.id}
                isLoading={isLoading}
                onClearFoundSession={handleClearFoundSession}
            />
            <div className="w-full max-w-2xl flex justify-between items-center">
                <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text font-medium text-sm">
                    Podx @ {new Date().getFullYear()}
                </span>

                <div className="socials flex gap-[8px]">
                    <a
                        href="https://t.me/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Join us on Telegram"
                        className="social-icon h-[24px] w-[24px]"
                    >
                        <Telegram />
                    </a>
                    <Link href="#" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                        <Farcaster />
                    </Link>
                    <a
                        href="https://x.com/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Follow us on X"
                        className="social-icon h-[24px] w-[24px]"
                    >
                        <X />
                    </a>
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
                        firstTimeUser={user.firstTimeUser} // Make sure this property exists in your user state
                    />
                )}
            </React.Suspense>
        </div>
    );
}
