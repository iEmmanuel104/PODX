//app/pod/[id]/page.tsx
'use client';
export const runtime = "edge";


import '@stream-io/video-react-sdk/dist/css/styles.css';
import React, { useState, useEffect, useMemo, useCallback, Suspense, memo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBalance } from 'wagmi';
import { useTipping } from '@/hooks/useTipping';
import { useTypedSelector } from '@/store/config/store';
import clsx from 'clsx';
import {
    StreamTheme,
    useCall as useStreamCall,
    combineComparators,
    role,
    speaking,
    publishingVideo,
    publishingAudio,
    useCallStateHooks,
    useConnectedUser,
    StreamVideoEvent,
    CallingState,
    CustomVideoEvent,
    hasScreenShare,
    isPinned,
    Call,
    CallTypes,
    PermissionRequestEvent,
    CallRingEvent,
} from '@stream-io/video-react-sdk';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'react-hot-toast';
import { CachId } from '@/constants';
import { cacheValue } from '@/utils/storage';
import { useNavigate } from '@/hooks/useNavigate';

interface MeetingProps {
    params: {
        id: string;
    };
}

interface ApplaudEventData {
    userId: string;
    timestamp: number;
}

interface StreamCustomEvent extends Omit<CustomVideoEvent, 'type'> {
    type: 'custom';
    custom: {
        type: 'applaud' | 'tip';
        data: ApplaudEventData;
    };
}

// Optimize imports with dynamic loading
const DynamicComponents = {
    TipModal: React.lazy(() => import('@/components/meeting/tips')),
    ParticipantsSidebar: React.lazy(() => import('@/components/meeting/participantList')),
    Notifications: React.lazy(() => import('@/components/meeting/notifications')),
    Header: React.lazy(() => import('@/components/meeting/header')),
    EndScreen: React.lazy(() => import('@/components/meeting/end-screen')),
    SpeakerLayout: React.lazy(() => import('@/components/pod/speakerLayout')),
    GridLayout: React.lazy(() => import('@/components/pod/gridLayout')),
    MeetingFooter: React.lazy(() => import('@/components/meeting/meetingFooter')),
    TipNotification: React.lazy(() => import('@/components/meeting/tip-notification')),
};

// Create a loading fallback component
const ComponentLoader = memo(() => (
    <div className="animate-pulse bg-gray-800 rounded-lg h-full w-full" />
));
ComponentLoader.displayName = 'ComponentLoader';

// Memoize the main interface component
const MeetingInterface: React.FC<MeetingProps> = memo(({ params }) => {
    const call = useStreamCall();
    const { id } = params;
    // const router = useRouter();
    const navigate = useNavigate();
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const { authenticated, ready } = usePrivy();
    const authChecked = useRef(false);
    const {
        useCallMembers,
        useParticipants,
        useIsCallLive,
        useCallCustomData,
        useCallCallingState,
        useScreenShareState,
        useSpeakerState,
        useMicrophoneState,
    } = useCallStateHooks();

    // Strong authentication check - runs immediately
    useEffect(() => {
        // Immediate check on component mount
        if (!isLoggedIn || !authenticated) {
            // Save the session code for after login in both localStorage and cookie
            // localStorage.setItem(CachId, id);
            
            // // Also store in a cookie for more reliable persistence
            // document.cookie = `${CachId}=${id}; path=/; max-age=3600`;

            cacheValue(CachId, id);
            
            // Redirect to home page
            // router.replace('/');
            navigate("/");
            
            // Show informative message
            toast('Authentication required', {
                icon: '🔐',
                duration: 5000,
            });
            console.debug('Redirecting from pod page - user not authenticated', { authenticated, isLoggedIn });
            return;
        }

        // Set the flag so we don't redirect after authentication
        authChecked.current = true;
    }, [authenticated, isLoggedIn, id, navigate]);

    // Second check that waits for Privy to be ready
    useEffect(() => {
        if (ready && !authChecked.current) {
            if (!authenticated || !isLoggedIn) {
                // Save the session code for after login
                localStorage.setItem(CachId, id);
                // Redirect to home page
                // router.replace('/');
                navigate('/');
                // Show informative message
                toast('Please login to join this session', {
                    icon: '🔐',
                    duration: 5000,
                });
                return;
            }
        }
    }, [ready, authenticated, isLoggedIn, id, navigate]);

    const participantComparator = useMemo(() => {
        return combineComparators(
            // First sort by screen sharing
            (a, b) => (hasScreenShare(b) ? 1 : hasScreenShare(a) ? -1 : 0),
            // Then by pinned status
            (a, b) => (isPinned(b) ? 1 : isPinned(a) ? -1 : 0),
            // Then by role
            role('host', 'cohost', 'user', 'listener'),
            // Then by speaking status
            speaking,
            // Then by those publishing video
            publishingVideo,
            // Then by those publishing audio
            publishingAudio
        );
    }, []);

    // Use the custom comparator with useParticipants
    const members = useCallMembers();
    const participants = useParticipants({ sortBy: participantComparator });
    const customData = useCallCustomData();
    const live = useIsCallLive();
    const { screenShare } = useScreenShareState() || {};
    const connectedUser = useConnectedUser();
    const callingState = useCallCallingState();
    const { speaker, devices } = useSpeakerState();

    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);
    const userAddress = user?.walletAddress as `0x${string}`;
    const [participantInSpotlight, _] = participants;
    const walletClientType = useTypedSelector(state => state.auth.user?.walletType);
    const isEmbeddedWallet = walletClientType === 'privy';
    const isUnkownOrIdle =
        callingState === CallingState.UNKNOWN || callingState === CallingState.IDLE;

    const {
        showTipModal,
        tipAmount,
        selectedTipRecipient,
        receivedTips,
        selectedCurrency,
        openTipModal,
        handleTip,
        handleCancelTip,
        setTipAmount,
        setCurrency,
        handleTipEvent,
        setState,
    } = useTipping(isEmbeddedWallet);

    const {
        data: balance,
        isError,
        isLoading,
    } = useBalance({
        address: userAddress,
    });

    const formattedBalance = balance ? Number(balance.value) / 1e18 : 0;
    const displayBalance = formattedBalance.toFixed(4);

    const isSpeakerLayout = useMemo(() => {
        if (participantInSpotlight) {
            return hasScreenShare(participantInSpotlight) || isPinned(participantInSpotlight);
        }
        return false;
    }, [participantInSpotlight]);

    useEffect(() => {
        if (call) {
            call.microphone
                .disable()
                .then(() => console.debug('Mic disabled by default'))
                .catch(console.error);
        }
    }, [call]);

    useEffect(() => {
        const startup = async () => {
            if (isUnkownOrIdle) {
                // router.push(`/pod/join/${id}`);
                navigate(`/pod/join/${id}`);
                return;
            }
        };

        startup();
    }, [call, navigate, id, isUnkownOrIdle]);

    // Add type definition for CallEventHandler
    type CallEventHandler = (event: StreamVideoEvent) => void;

    // Update the event handler with useCallback and proper typing
    const handleCallEvent = useCallback<CallEventHandler>(event => {
        switch (event.type) {
            case 'custom': {
                const customEvent = event as unknown as StreamCustomEvent;
                if (customEvent.custom.type === 'applaud') {
                    if (customEvent.custom.data.userId !== connectedUser?.id) {
                        const clapSound = new Audio('/sounds/clap-sound.mp3');
                        clapSound.play().catch(console.error);
                    }
                }
                handleTipEvent(event as CustomVideoEvent);
                break;
            }
            case 'call.permission_request': {
                const permissionEvent = event as PermissionRequestEvent;
                setSpeakRequests(prev => [...prev, permissionEvent.user.id]);
                break;
            }
            case 'call.ring': {
                const ringEvent = event as CallRingEvent;
                setJoinRequests(prev => [...prev, ringEvent.user.id]);
                break;
            }
        }
    }, [connectedUser?.id, handleTipEvent]);

    // Remove duplicate custom case and update the sendCustomEvent call
    const handleApplaud = useCallback(() => {
        if (!call || !connectedUser) return;

        const clapSound = new Audio('/sounds/clap-sound.mp3');
        clapSound.play().catch(console.error);

        call.sendCustomEvent({
            type: 'custom',
            custom: {
                type: 'applaud',
                data: {
                    userId: connectedUser.id,
                    timestamp: Date.now()
                }
            }
        });
    }, [call, connectedUser]);

    useEffect(() => {
        if (!call || !('on' in call)) return;

        const unsubscribe = (call as unknown as Call).on('custom', handleCallEvent);
        return () => unsubscribe();
    }, [call, handleCallEvent]);

    const handleJoinSession = useCallback(() => {
        if (!call || !connectedUser) return;

        const needsToJoin = [CallingState.IDLE, CallingState.UNKNOWN].includes(callingState);

        if (needsToJoin && !live) {
            call.microphone
                .disable()
                .then(() => {
                    console.debug('Microphone disabled before join');
                    // router.push(`/pod/join/${id}`);
                    navigate(`/pod/join/${id}`);
                })
                .catch(console.error);
        }
    }, [id, callingState, call, connectedUser, navigate, live]);

    useEffect(() => {
        handleJoinSession();
    }, [handleJoinSession]);

    const leaveCall = async () => {
        try {
            if (call && 'leave' in call && callingState !== CallingState.OFFLINE) {
                await (call as unknown as Call).leave();
            }
            // router.push(`/pod/end`);
            navigate(`/pod/end`);
        } catch (error) {
            console.error('Error leaving call:', error);
            // router.push(`/pod/end`);
            navigate(`/pod/end`);
        }
    };

    const toggleScreenShare = useCallback(async () => {
        if (!call || !screenShare) {
            console.debug('Call or screen share not available');
            return;
        }

        try {
            await screenShare.toggle();
        } catch (error) {
            console.error('Error toggling screen share:', error);
        }
    }, [call, screenShare]);

    const toggleParticipants = useCallback(() => {
        setShowParticipants(prev => !prev);
    }, []);

    const confirmLeave = async () => {
        // router.push('/pod');
        navigate('/pod');
    };

    const updateParticipantRole = (userId: string, newRole: string) => {
        console.debug(`Updating ${userId} to ${newRole}`);
    };

    const handleJoinRequest = (userId: string, accept: boolean) => {
        if (accept) {
            onAcceptJoin(userId);
        } else {
            onRejectJoin(userId);
        }
    };

    const onAcceptJoin = (user: string) => {
        setJoinRequests(prev => prev.filter(u => u !== user));
    };

    const onRejectJoin = (user: string) => {
        setJoinRequests(prev => prev.filter(u => u !== user));
    };

    const onAcceptSpeak = (user: string) => {
        setSpeakRequests(prev => prev.filter(u => u !== user));
    };

    const onRejectSpeak = (user: string) => {
        setSpeakRequests(prev => prev.filter(u => u !== user));
    };

    const handleLogout = () => {
        // Implement logout logic here
    };

    const copyAddress = () => {
        // Implement copy to clipboard functionality
    };

    // Optimize layout determination
    const layoutType = useMemo(() => {
        if (!participantInSpotlight) return 'grid';
        return hasScreenShare(participantInSpotlight) || isPinned(participantInSpotlight)
            ? 'speaker'
            : 'grid';
    }, [participantInSpotlight]);

    // Add preloading effect inside the component
    useEffect(() => {
        const preloadComponents = async () => {
            const imports = [
                import('@/components/meeting/header'),
                import('@/components/pod/gridLayout'),
                import('@/components/pod/speakerLayout'),
            ];
            await Promise.all(imports);
        };
        preloadComponents();
    }, []);

    useEffect(() => {
        call?.on('custom', handleCallEvent);
        return () => {
            call?.off('custom', handleCallEvent);
        };
    }, [call, handleCallEvent]);

    // Update the media initialization
    useEffect(() => {
        const initializeMedia = async () => {
            if (!call) return;

            try {
                // Start with microphone disabled
                await call.microphone.disable();

                // Only enable camera
                await call.camera.enable();

                // Setup speaker
                if (devices?.length > 0) {
                    await speaker.select(devices[0].deviceId);
                    speaker.setVolume(1.0);
                }

                console.debug('Media devices initialized with muted mic');
            } catch (error) {
                console.error('Media initialization failed:', error);
            }
        };

        initializeMedia();
    }, [call, speaker, devices]);

    return (
        <StreamTheme className="root-theme">
            <div className="h-screen bg-[#151515] text-white flex flex-col w-[95%] mx-auto">
                <Suspense fallback={<ComponentLoader />}>
                    <DynamicComponents.Header
                        userInfo={user}
                        withdrawFunds={isEmbeddedWallet}
                        customData={customData}
                        live={live}
                        userAddress={userAddress}
                        displayBalance={displayBalance}
                        balanceSymbol={balance?.symbol}
                        toggleParticipants={toggleParticipants}
                        copyAddress={copyAddress}
                    />
                </Suspense>

                <div
                    className={clsx(
                        'flex-grow flex overflow-hidden relative',
                        'mb-[60px] sm:mb-20'
                    )}
                >
                    <div
                        className={clsx(
                            'flex-1 transition-all duration-300 ease-in-out',
                            showParticipants ? 'sm:mr-[224px] lg:mr-[256px] xl:mr-[320px]' : ''
                        )}
                    >
                        <Suspense fallback={<ComponentLoader />}>
                            {layoutType === 'speaker' ? (
                                <DynamicComponents.SpeakerLayout />
                            ) : (
                                <DynamicComponents.GridLayout />
                            )}
                        </Suspense>
                    </div>

                    {showParticipants && (
                        <Suspense fallback={<ComponentLoader />}>
                            <DynamicComponents.ParticipantsSidebar
                                isOpen={showParticipants}
                                onClose={() => setShowParticipants(false)}
                                members={members}
                                participants={participants}
                                currentUser={connectedUser}
                                openTipModal={openTipModal}
                                updateParticipantRole={updateParticipantRole}
                                handleJoinRequest={handleJoinRequest}
                            />
                        </Suspense>
                    )}
                </div>

                <Suspense fallback={<ComponentLoader />}>
                    <DynamicComponents.MeetingFooter
                        leaveCall={leaveCall}
                        toggleScreenShare={toggleScreenShare}
                        customData={customData}
                    />
                </Suspense>

                {/* Modals and notifications */}
                {showTipModal && selectedTipRecipient && (
                    <Suspense fallback={null}>
                        <DynamicComponents.TipModal
                            selectedTipRecipient={selectedTipRecipient}
                            walletAddress={selectedTipRecipient.user.custom.walletAddress}
                            tipAmount={tipAmount}
                            setTipAmount={setTipAmount}
                            handleTip={handleTip}
                            onCancel={handleCancelTip}
                            balance={displayBalance}
                            selectedCurrency={selectedCurrency}
                            setCurrency={setCurrency}
                        />
                    </Suspense>
                )}
                {showThankYouModal && (
                    <Suspense fallback={null}>
                        <DynamicComponents.EndScreen onClose={confirmLeave} user={user} />
                    </Suspense>
                )}
                <Suspense fallback={null}>
                    <DynamicComponents.Notifications
                        joinRequests={joinRequests}
                        speakRequests={speakRequests}
                        onAcceptJoin={onAcceptJoin}
                        onRejectJoin={onRejectJoin}
                        onAcceptSpeak={onAcceptSpeak}
                        onRejectSpeak={onRejectSpeak}
                        callingState={callingState}
                    />
                </Suspense>
                {showTipSuccess && selectedTipRecipient && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-[10px] flex items-center text-xs sm:text-sm z-50">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        You successfully tipped {selectedTipRecipient.user.name} {tipAmount}{' '}
                        {selectedCurrency}
                    </div>
                )}
                {receivedTips.length > 0 &&
                    receivedTips.map((tip, index) => (
                        <Suspense key={index} fallback={null}>
                            <DynamicComponents.TipNotification
                                tip={{
                                    from: tip.from,
                                    amount: `${tip.amount} ${tip.currency}`,
                                    profileImage: '/images/default-avatar.png',
                                }}
                                onClose={() => {
                                    const newTips = [...receivedTips];
                                    newTips.splice(index, 1);
                                    setState(prevState => ({
                                        ...prevState,
                                        receivedTips: newTips,
                                    }));
                                }}
                            />
                        </Suspense>
                    ))}
            </div>
        </StreamTheme>
    );
});

MeetingInterface.displayName = 'MeetingInterface';

export default MeetingInterface;
