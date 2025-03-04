'use client';
export const runtime = 'edge';

import React, { useState, useCallback, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    useCall,
    useCallStateHooks,
    CallingState,
    type CallParticipantResponse,
    type ErrorFromResponse,
    type GetCallResponse,
} from '@stream-io/video-react-sdk';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useContext } from 'react';
import { AppContext } from '@/providers/appProvider';
import { useScheduledCalls } from '@/hooks/useScheduledCalls';
import { setSessionInfo } from '@/store/pod/slice';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import { usePrivy } from '@privy-io/react-auth';
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
    isWhitelisted: boolean;
    callInfo: {
        title: string;
        creator: {
            username: string | null;
        };
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

const NotWhitelistedScreen = React.lazy(() =>
    import('@/components/join/not-whitelisted-screen').then(mod => ({
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
            className="mt-4 w-full max-w-sm sm:max-w-md bg-[#6032F6] text-white px-4 sm:px-8 py-2 sm:py-2.5 
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

// Break circular dependency with forward reference
let initializeCallImpl: any = null;

// Main Component
const JoinSession: React.FC<JoinSessionProps> = ({ params }) => {
    const router = useRouter();
    const code = params.id;
    const dispatch = useAppDispatch();
    const { retrieveCall } = useScheduledCalls();
    const hasCheckedSchedule = useRef(false);
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const { ready, authenticated } = usePrivy();
    const authChecked = useRef(false);

    // Strong authentication check - runs immediately and again after Privy is ready
    useEffect(() => {
        // Immediate check on component mount
        if (!isLoggedIn || !authenticated) {
            // Save the session code for after login in both localStorage and cookie
            localStorage.setItem('pendingSessionCode', code);

            // Also store in a cookie for more reliable persistence
            document.cookie = `pendingSessionCode=${code}; path=/; max-age=3600`;

            // Redirect to home page
            router.replace('/');

            // Show informative message
            toast.error('Please login to join this session', {
                duration: 5000,
            });
            return;
        }

        // Set the flag so we don't redirect after authentication
        authChecked.current = true;
    }, [authenticated, isLoggedIn, code, router]);

    // Second check that waits for Privy to be ready
    useEffect(() => {
        if (ready && !authChecked.current) {
            if (!authenticated || !isLoggedIn) {
                // Save the session code for after login in both localStorage and cookie
                localStorage.setItem('pendingSessionCode', code);

                // Also store in a cookie for more reliable persistence
                document.cookie = `pendingSessionCode=${code}; path=/; max-age=3600`;

                // Redirect to home page
                router.replace('/');

                // Show informative message
                toast.error('Please login to join this session', {
                    duration: 5000,
                });
                console.log('Redirecting from JoinSession - user not authenticated', { authenticated, isLoggedIn });
                return;
            }
            // Mark as checked if authenticated
            authChecked.current = true;
        }
    }, [ready, authenticated, isLoggedIn, code, router]);

    // State
    const [state, setState] = useState<JoinSessionState>({
        name: '',
        joining: false,
        loading: true,
        showScheduledDialog: false,
        scheduledMeetData: null,
        isWhitelisted: true,
        callInfo: null,
    });
    const [participants, setParticipants] = useState<CallParticipantResponse[]>([]);

    // Selectors and Context
    const { sessionTitle, sessionType: sessionTypeFromStore, isScheduled, starts_at, tokenGate } = useTypedSelector(
        state => state.pod
    );
    const { newMeeting, setNewMeeting } = useContext(AppContext);

    // Stream Video Hooks
    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    // Initialize call function
    const initializeCall = useCallback(async () => {
        if (state.joining || !code || !user) return;

        try {
            if (callingState === CallingState.JOINED) {
                await call?.leave();
            }

            const isScheduledCall = isScheduled || (state.scheduledMeetData !== null);
            console.log('Initializing call with newMeeting:', newMeeting, 'isScheduled:', isScheduledCall, 'code:', code);

            if (newMeeting) {
                console.log('Creating new call with ID:', code);
                const members = [{ user_id: user.id, role: 'host' }];
                if (tokenGate && tokenGate.length > 0) {
                    tokenGate.forEach(userId => {
                        if (userId !== user.id) {
                            members.push({ user_id: userId, role: 'user' });
                        }
                    });
                }

                try {
                    const callResponse = await call?.getOrCreate({
                    data: {
                        members,
                        custom: {
                            sessionId: code,
                            title: sessionTitle || 'New Call',
                                type: sessionTypeFromStore || sessionType.POD,
                            isTokenGated: tokenGate && tokenGate.length > 0,
                            whitelistedUsers: tokenGate || [],
                        },
                        settings_override: {
                            limits: {
                                max_participants: 20,
                                max_duration_seconds: 3600,
                            },
                        },
                            ...(isScheduledCall && { starts_at }),
                    },
                    members_limit: 20,
                        ...(sessionTypeFromStore === sessionType.AUDIO && { video: false }),
                    });
                    console.log('Call created successfully:', callResponse);
                    
                    // If we successfully created a call, set newMeeting to false to avoid recreating
                    if (callResponse?.call) {
                        setNewMeeting(false);
                    }
                    
                    return callResponse;
                } catch (createError) {
                    console.error('Error creating call:', createError);
                    throw createError;
                }
            } else {
                // For existing calls, whether scheduled or not
                console.log('Trying to get existing call with ID:', code);
                let callData;
                try {
                    callData = await call?.get();
                    console.log('Retrieved call data:', callData);
                } catch (getError) {
                    console.error('Error getting call data:', getError);
                    
                    // If the call doesn't exist but we thought it did, let's create it
                    console.log('Call not found but expected, attempting to create it now');
                    setNewMeeting(true);
                    return initializeCall();
                }

                if (callData?.call) {
                    // Check if user is not the creator
                    if (callData.call.created_by.id !== user.id) {
                        const whitelistedUsers = callData.call.custom?.whitelistedUsers;

                        if (
                            whitelistedUsers &&
                            Array.isArray(whitelistedUsers) &&
                            whitelistedUsers.length > 0
                        ) {
                            const isWhitelisted = whitelistedUsers.includes(user.id);

                            if (!isWhitelisted) {
                                toast.error('You are not whitelisted to join this call');
                                router.push('/pod');
                                return;
                            }
                        }
                    }

                    setParticipants(callData.call.session?.participants || []);

                    // Get session type safely and ensure it's a valid type
                    let callSessionType = sessionType.POD; // Default to POD
                    const customType = callData.call.custom?.type;
                    if (customType === sessionType.AUDIO) {
                        callSessionType = sessionType.AUDIO;
                    }

                    // Check for required custom data and use defaults if missing
                    const callTitle = callData.call.custom?.title || 'Untitled Session';
                    const whitelistedUsers = callData.call.custom?.whitelistedUsers || [];
                    const startsAt = callData.call.starts_at;

                    dispatch(
                        setSessionInfo({
                            title: callTitle,
                            type: callSessionType,
                            sessionId: code,
                            tokenGate: whitelistedUsers,
                            isScheduled: !!startsAt,
                            starts_at: startsAt,
                        })
                    );
                    
                    return callData;
                } else {
                    // If the call doesn't exist yet, try to create it
                    // This might happen for scheduled calls that haven't been created yet
                    console.log('Call not found, attempting to create it for scheduled session');

                    // Set newMeeting to true to force creation
                    setNewMeeting(true);

                    // Call initializeCall again with newMeeting set to true
                    return initializeCall();
                }
            }
        } catch (error) {
            const err = error as ErrorFromResponse<GetCallResponse>;
            console.error('Error initializing call:', err);
            // Log full error details
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast.error('Failed to initialize the session. Please try again.');

            // Don't redirect immediately, give user a chance to retry
            setState(prev => ({ ...prev, loading: false }));
            throw error; // Rethrow to allow caller to handle
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [
        call,
        callingState,
        code,
        dispatch,
        isScheduled,
        newMeeting,
        router,
        sessionTitle,
        sessionTypeFromStore,
        starts_at,
        state.joining,
        state.scheduledMeetData,
        tokenGate,
        user,
        setNewMeeting,
    ]);

    // Assign implementation for forward reference
    initializeCallImpl = initializeCall;

    // Check scheduled meeting
    const checkScheduledMeeting = useCallback(async () => {
        if (!code || !user || hasCheckedSchedule.current) return;
        hasCheckedSchedule.current = true;

        try {
            console.log('Checking for scheduled meeting with code:', code);
        const response = await retrieveCall(code);
            console.log('Retrieve call response:', response);

        if (
            response.status === 'success' &&
            response.data?.call &&
            response.data.source === 'scheduled'
        ) {
            const { call } = response.data;
                console.log('Found scheduled call:', call);

                // Verify required data exists
                if (!call.custom) {
                    console.error('Missing custom data in scheduled call');
                    call.custom = {
                        title: 'Untitled Session',
                        type: sessionType.POD,
                        sessionId: code,
                        whitelistedUsers: []
                    };
                }

                // For scheduled sessions, determine the session type
                let callSessionType = sessionType.POD; // Default
                if (call.custom?.type === sessionType.AUDIO) {
                    callSessionType = sessionType.AUDIO;
                }

                // Store the session info in Redux before initializing
                dispatch(
                    setSessionInfo({
                        title: call.custom.title || 'Untitled Session',
                        type: callSessionType,
                        sessionId: call.custom.sessionId || code,
                        starts_at: call.starts_at,
                        tokenGate: call.custom.whitelistedUsers || [],
                        isScheduled: true
                    })
                );

            setState(prev => ({
                ...prev,
                loading: false,
                showScheduledDialog: true,
                scheduledMeetData: {
                        title: call.custom.title || 'Untitled Session',
                        startTime: call.starts_at || new Date().toISOString(),
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
                        type: call.custom.type || sessionType.POD,
                        sessionId: call.custom.sessionId || code,
                        createdAt: call.created_at || new Date().toISOString(),
                },
            }));

                // Even for scheduled sessions, initialize the call but don't wait
                initializeCall();
            } else if (
                response.status === 'success' &&
                response.data?.call &&
                response.data.source === 'stream'
            ) {
                const { call } = response.data;
                console.log('Found stream call:', call);

                // Check if user is not the creator
                if (call.created_by.id !== user.id) {
                    const whitelistedUsers = call.custom?.whitelistedUsers;

                    if (
                        whitelistedUsers &&
                        Array.isArray(whitelistedUsers) &&
                        whitelistedUsers.length > 0
                    ) {
                        const isWhitelisted = whitelistedUsers.includes(user.id);

                        if (!isWhitelisted) {
                            setState(prev => ({
                                ...prev,
                                loading: false,
                                isWhitelisted: false,
                                callInfo: {
                                    title: call.custom?.title || 'Unknown Session',
                                    creator: {
                                        username:
                                            call.created_by.custom?.username ||
                                            call.created_by.name ||
                                            null,
                                    },
                                },
                            }));
                            return;
                        }
                    }
                }
            } else {
                console.log('No call found for code:', code);
            }
            // No scheduled call found, proceed with normal call initialization
            await initializeCall();
        } catch (error) {
            console.error('Error checking scheduled meeting:', error);
            // Still try to initialize call as a fallback
            await initializeCall();
        }
    }, [code, user, retrieveCall, initializeCall, dispatch]);

    // Join session handler
    const handleJoinSession = useCallback(async () => {
        if (!code) return;

        setState(prev => ({ ...prev, joining: true }));

        try {
            console.log('Attempting to join session with ID:', code);
            console.log('Current callingState:', callingState);
            console.log('Session info:', {
                title: sessionTitle,
                type: sessionTypeFromStore,
                isScheduled: isScheduled,
                starts_at: starts_at
            });

            // Try to get call data first
            let callExists = false;
            try {
                const callData = await call?.get();
                console.log('Call data before joining:', callData);
                callExists = !!callData?.call;
            } catch (getError) {
                console.log('Call does not exist, will create it:', getError);
                callExists = false;
            }

            // If the call doesn't exist, create it now
            if (!callExists) {
                console.log('Call not found on server, will create it now');
                // Set newMeeting to true to force creation
                setNewMeeting(true);
                
                try {
                    // Create the call
                    await initializeCall();
                    console.log('Call created successfully');
                } catch (createError) {
                    console.error('Error creating call:', createError);
                    throw createError;
                }
            }

            // Get the call again to verify it was created
            try {
                const refreshedCallData = await call?.get();
                console.log('Refreshed call data after initialization:', refreshedCallData);
                
                if (!refreshedCallData?.call) {
                    console.error('Call still does not exist after creation attempt');
                    throw new Error('Failed to create call. Please try again.');
                }
            } catch (verifyError) {
                console.error('Error verifying call creation:', verifyError);
                throw verifyError;
            }

            // Now join the call
            if (callingState !== CallingState.JOINED) {
                console.log('Joining call now...');
                const joinResponse = await call?.join({
                    data: {
                        members: [{ user_id: user?.id! }],
                    },
                    ...(sessionTypeFromStore === sessionType.AUDIO && { video: false }),
                });
                console.log('Join response:', joinResponse);
            }

            router.push(`/pod/${code}`);
        } catch (error) {
            console.error('Join session error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast.error('Failed to join session, please check your connection and try again');
            setState(prev => ({ ...prev, joining: false }));
        }
    }, [code, user, call, callingState, router, sessionTypeFromStore, isScheduled, sessionTitle, starts_at, setNewMeeting, initializeCall]);

    // Effects
    useEffect(() => {
        if (isLoggedIn && user) {
            setState(prev => ({
                ...prev,
                name: user.username || '',
            }));
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        checkScheduledMeeting();
    }, [checkScheduledMeeting]);

    useEffect(() => {
        setNewMeeting(newMeeting);
        return () => {
            setNewMeeting(false);
        };
    }, [newMeeting, setNewMeeting]);

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

    if (!state.isWhitelisted) {
        return (
            <Suspense fallback={<SimpleLoader />}>
                <NotWhitelistedScreen
                    title={state.callInfo?.title || 'Unknown Session'}
                    creator={state.callInfo?.creator}
                />
            </Suspense>
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
                        <div className="w-32 sm:w-40 md:w-48 mb-6 sm:mb-8 mx-auto">
                            <Logo />
                        </div>
                    </Suspense>

                    <div className="mb-6 sm:mb-8 text-center space-y-2">
                        <p className="text-gray-400 text-sm sm:text-base">You are about to join</p>
                        <p className="text-white text-base sm:text-lg md:text-xl font-medium">
                            {sessionTitle || 'Base Live Build Session'}
                            <span className="text-gray-400">
                                ({sessionTypeFromStore || sessionType.POD})
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
