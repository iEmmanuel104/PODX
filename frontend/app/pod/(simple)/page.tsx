// app/pod/page.tsx
'use client';
import React, { useState, useCallback, useEffect } from 'react';

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
import { useNavigate } from '@/hooks/useNavigate';

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
    // const router = useRouter();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = React.useContext(AppContext);
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const sessionInfo = useTypedSelector(state => state.pod);
    const { 
        scheduledSessions, 
        scheduleCall, 
        retrieveCall, 
        isLoading, 
        getOrCreateCall 
    } = useScheduledCalls();
    const currentUrl = window.location.origin || 'https://www.podx.fun';
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
    // Effect if there is no user name
    useEffect(() => {
        if (isLoggedIn && user?.username?.startsWith('guest-')) {
            setState(prev => ({ ...prev, showUsernameModal: true }));
        }
    }, [isLoggedIn, user]);

    const handleStreamCall = useCallback(
        async (response: StreamCallData) => {
            // Check if this is a valid session
            if (!response.id || !response.custom?.sessionId) {
                console.error('Invalid session data:', response);
                setState(prev => ({
                    ...prev,
                    error: 'Invalid session data. Please try again.',
                }));
                return;
            }
            try {
                // For scheduled sessions, we need to create a real Stream call first
                // Scheduled sessions will have a starts_at time but might not have an actual Stream call created yet
                // We can detect this by checking the source from retrieveCall endpoint
                const { data } = await retrieveCall(response.custom.sessionId);
                if (data?.source === 'scheduled') {
                    console.debug('Creating real Stream call for scheduled session:', response.custom.sessionId);
                    
                    // Use one of the allowed Stream call types
                    // Stream API only allows these call types: "audio_room", "default", "development", "livestream"
                    // Rather than trying to sanitize a custom type, use a known valid type
                    const callType = "default"; // Use 'default' as the safe choice
                    console.debug('Using Stream API compatible call type:', callType);
                    
                    // Call the API to create a real Stream call
                    const result = await getOrCreateCall({
                        callType: callType,
                        callId: response.custom.sessionId,
                        members: user?.id ? [{ user_id: user.id }] : [],
                        settings: {
                            // Copy relevant settings from the scheduled session
                        }
                    });
                    
                    // Re-fetch the call to get the Stream call details
                    const refreshedData = await retrieveCall(response.custom.sessionId);
                    if (refreshedData?.data?.call) {
                        // Update response with the fresh data
                        response = refreshedData.data.call;
                    }
                }
                // Update session info and navigate
                dispatch(
                    setSessionInfo({
                        title: response.custom.title,
                        type: response.custom.type as sessionType,
                        sessionId: response.custom.sessionId,
                        starts_at: response.starts_at,
                        tokenGate: response.custom.whitelistedUsers ?? undefined,
                    })
                );
                // Navigate to join page
                // router.push(`/pod/join/${response.custom.sessionId}`);
                navigate(`/pod/join/${response.custom.sessionId}`);
            } catch (error) {
                console.error('Error joining session:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Failed to join session. Please try again.',
                }));
            }
        },
        [dispatch, navigate, retrieveCall, user?.id, getOrCreateCall]
    );

    const handleCreateSession = useCallback(
        async (title: string, type: sessionType, scheduledDate?: Date, tokenGate?: string[]) => {
            console.debug("[handleCreateSession] Creating session with:", { title, type, scheduledDate, hasTokenGate: !!tokenGate });
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
                    console.debug("[handleCreateSession] Found time conflict with existing session");
                    setState(prev => ({
                        ...prev,
                        error: 'Cannot schedule a session at this time. There is already a session scheduled at exactly the same time.',
                    }));
                    return;
                }

                try {
                    console.debug("[handleCreateSession] Calling scheduleCall API with:", {
                        title,
                        type,
                        sessionId: newSessionCode,
                        starts_at: startDate.toISOString(),
                        tokenGate,
                        scheduledDuration: 60
                    });
                    
                    const result = await scheduleCall({
                        title,
                        type,
                        sessionId: newSessionCode,
                        starts_at: startDate.toISOString(),
                        tokenGate,
                        scheduledDuration: 60, // Set a default duration of 60 minutes
                    });

                    console.debug("[handleCreateSession] Schedule call API response:", result);

                    if (!result.data) {
                        console.error("[handleCreateSession] Failed to schedule call - no data returned");
                        throw new Error('Failed to schedule call');
                    }

                    dispatch(setSessionInfo(sessionData));

                    if (result.data && result.data.data) {
                        console.debug("[handleCreateSession] Adding scheduled session to Redux store:", result.data.data);
                        dispatch(addScheduledSession(result.data.data));
                    } else {
                        console.error("[handleCreateSession] No session data to add to Redux store");
                    }

                    setState(prev => ({
                        ...prev,
                        inviteLink: `${currentUrl}/pod/join/${newSessionCode}`,
                        sessionCode: newSessionCode,
                        isCreateModalOpen: false,
                        isCreatedModalOpen: true,
                        justScheduledSession: true,
                        error: '', // Clear any previous errors
                    }));

                    return;
                } catch (error) {
                    console.error('[handleCreateSession] Failed to schedule call:', error);
                    setState(prev => ({
                        ...prev,
                        error: 'Failed to schedule the call',
                    }));
                    return;
                }
            }

            setState(prev => ({
                ...prev,
                inviteLink: `${currentUrl}/pod/join/${newSessionCode}`,
                sessionCode: newSessionCode,
                isCreateModalOpen: false,
                isCreatedModalOpen: true,
            }));

            dispatch(setSessionInfo(sessionData));
        },
        [dispatch, setNewMeeting, scheduleCall, scheduledSessions, currentUrl]
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
            // router.push(`/pod/join/${state.sessionCode}`);
            navigate(`/pod/join/${state.sessionCode}`);
        } catch (error) {
            console.error('Failed to join created session:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to join session. Please try again.',
            }));
        } finally {
            setState(prev => ({ ...prev, isJoiningCreated: false }));
        }
    }, [state.sessionCode, navigate]);

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
        // router.push('/');
        // navigate('/');
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
                    {(() => {
                        console.debug('[PodPage] Rendering ScheduledPods component with:', {
                            scheduledSessions,
                            foundSession: state.foundSession,
                            isLoading,
                            scheduledSessionsCount: scheduledSessions?.length,
                        });
                        return null;
                    })()}
                    <ScheduledPods
                        sessions={scheduledSessions}
                        foundSession={state.foundSession}
                        onJoinSession={session => {
                            handleStreamCall(session);
                        }}
                        onDeleteSession={()=>{}}
                        currentUserId={user?.id}
                        isLoading={isLoading}
                        onClearFoundSession={handleClearFoundSession}
                    />
                </div>
            </div>

            {/* Modals */}
            <React.Suspense fallback={null}>                
                <CreateSessionModal
                    isOpen={state.isCreateModalOpen}
                    onClose={() => setState(prev => ({ ...prev, isCreateModalOpen: false }))}
                    onCreateSession={handleCreateSession}
                    scheduledSessions={scheduledSessions}
                />

                <CreatedSessionModal
                    isOpen={state.isCreatedModalOpen}
                    onClose={() => setState(prev => ({ ...prev, isCreatedModalOpen: false }))}
                    inviteLink={state.inviteLink}
                    sessionCode={state.sessionCode}
                    isJoining={state.isJoiningCreated}
                    onJoinSession={handleJoinCreatedSession}
                    scheduledTime={sessionInfo.starts_at}
                />

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
