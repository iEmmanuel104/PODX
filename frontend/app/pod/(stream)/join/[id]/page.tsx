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
import { UsersRound, Clock } from 'lucide-react';
import { setAudioEnabled, setVideoEnabled } from '@/store/media/slice';

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
            // Save the session code for after login
            localStorage.setItem('pendingSessionCode', code);
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
                // Save the session code for after login
                localStorage.setItem('pendingSessionCode', code);
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
    const { sessionTitle, sessionType, isScheduled, starts_at, tokenGate } = useTypedSelector(
        state => state.pod
    );
    const { isAudioEnabled, isVideoEnabled } = useTypedSelector(state => state.media);
    const { newMeeting, setNewMeeting } = useContext(AppContext);
    // const { client: chatClient } = useChatContext();
    // Check if this is an audio session
    const isAudioSession = sessionType === 'Audio Session';

    // Stream Video Hooks
    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    // const tokenProvider = useStreamTokenProvider();

    // Initialize call function
    const initializeCall = useCallback(async () => {
        if (state.joining || !code || !user) return;

        try {
            if (callingState === CallingState.JOINED) {
                await call?.leave();
            }

            if (newMeeting) {
                const members = [{ user_id: user.id, role: 'host' }];
                if (tokenGate && tokenGate.length > 0) {
                    tokenGate.forEach(userId => {
                        if (userId !== user.id) {
                            members.push({ user_id: userId, role: 'user' });
                        }
                    });
                }

                await call?.getOrCreate({
                    data: {
                        members,
                        custom: {
                            sessionId: code,
                            title: sessionTitle || 'New Call',
                            type: sessionType || 'Video Session',
                            isTokenGated: tokenGate && tokenGate.length > 0,
                            whitelistedUsers: tokenGate || [],
                        },
                        settings_override: {
                            limits: {
                                max_participants: 100,
                                max_duration_seconds: 5400,
                            },
                        },
                        ...(isScheduled && { starts_at }),
                    },
                    members_limit: 100,
                    ...(sessionType === 'Audio Session' && { video: false }),
                });
            } else {
                const callData = await call?.get();

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
                    dispatch(
                        setSessionInfo({
                            title: callData.call.custom.title,
                            type: callData.call.custom.type,
                            sessionId: code,
                            tokenGate: callData.call.custom.whitelistedUsers || [],
                        })
                    );
                }
            }
        } catch (error) {
            const err = error as ErrorFromResponse<GetCallResponse>;
            console.error('Call initialization error:', {
                message: err.message,
                details: err.response?.data,
                status: err.response?.status,
                error: err
            });
            router.push('/pod');
            toast.error(`Error fetching meeting: ${err.message || 'Unknown error'}`);
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
        sessionType,
        starts_at,
        state.joining,
        tokenGate,
        user,
    ]);

    // Check scheduled meeting
    const checkScheduledMeeting = useCallback(async () => {
        if (!code || !user || hasCheckedSchedule.current) return;
        hasCheckedSchedule.current = true;

        const response = await retrieveCall(code);
        console.log('querying for call response:', response);
        if (
            response.status === 'success' &&
            response.data?.call &&
            response.data.source === 'scheduled'
        ) {
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
            if (
                response.status === 'success' &&
                response.data?.call &&
                response.data.source === 'stream'
            ) {
                const { call } = response.data;

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
                                    title: call.custom.title,
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
            }
            // No scheduled call found, proceed with normal call initialization
            await initializeCall();
        }
    }, [code, user, retrieveCall, initializeCall]);

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

    // Join session handler
    const handleJoinSession = useCallback(async () => {
        if (!code) return;

        setState(prev => ({ ...prev, joining: true }));

        try {
            // Get settings from localStorage (these will override Redux state)
            const storedAudioEnabled = localStorage.getItem('podMeetingAudioEnabled');
            const storedVideoEnabled = localStorage.getItem('podMeetingVideoEnabled');
            
            // Parse localStorage values or use Redux state as fallback
            const audioEnabled = storedAudioEnabled !== null ? 
                storedAudioEnabled === 'true' : isAudioEnabled;
            const videoEnabled = storedVideoEnabled !== null ? 
                storedVideoEnabled === 'true' : isVideoEnabled;
            
            // Log the media settings for debugging
            console.log('Media settings before joining:', { 
                fromRedux: { isAudioEnabled, isVideoEnabled },
                fromLocalStorage: { audioEnabled, videoEnabled },
                usingValues: { audioEnabled, videoEnabled }
            });
            
            if (callingState !== CallingState.JOINED) {
                // Join with the appropriate settings
                await call?.join({
                    data: {
                        members: [{ user_id: user?.id! }],
                    },
                    ...(sessionType === 'Audio Session' && { video: false }),
                });
                
                // Ensure the Redux state reflects our final decision
                dispatch(setAudioEnabled(audioEnabled));
                dispatch(setVideoEnabled(videoEnabled));
                
                // Set the directly to localStorage again to be extra safe
                localStorage.setItem('podMeetingJoiningWithAudio', String(audioEnabled));
                localStorage.setItem('podMeetingJoiningWithVideo', String(videoEnabled));
                
                console.log('Applying final media settings before navigation:', { 
                    audio: audioEnabled, 
                    video: videoEnabled 
                });
                
                // Apply audio settings before navigating - force a small delay to ensure settings take effect
                try {
                    // Apply audio settings
                    if (audioEnabled) {
                        await call?.microphone.enable();
                    } else {
                        await call?.microphone.disable();
                    }
                    
                    // Apply video settings before navigating
                    if (!isAudioSession) {
                        if (videoEnabled) {
                            await call?.camera.enable();
                        } else {
                            await call?.camera.disable();
                        }
                    }
                    
                    // Small delay to ensure settings take effect
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    console.log('Final media state before navigation:', {
                        microphone: call?.microphone?.enabled,
                        camera: call?.camera?.enabled
                    });
                } catch (error) {
                    console.error('Error applying media settings:', error);
                }
            }

            router.push(`/pod/${code}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to join session, please check your connection and try again');
            setState(prev => ({ ...prev, joining: false }));
        }
    }, [code, user, call, callingState, router, sessionType, isAudioSession, isAudioEnabled, isVideoEnabled, dispatch]);

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
                                ({sessionType || 'Video Session'})
                            </span>
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <div className="flex items-center text-gray-400 text-sm">
                                <UsersRound className="w-4 h-4 mr-1" />
                                <span>Up to 100 participants</span>
                            </div>
                            <div className="flex items-center text-gray-400 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>1.5 hour duration</span>
                            </div>
                        </div>
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
