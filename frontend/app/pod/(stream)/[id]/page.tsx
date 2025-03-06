//app/pod/[id]/page.tsx
'use client';
export const runtime = "edge";


import '@stream-io/video-react-sdk/dist/css/styles.css';
import React, { useState, useEffect, useMemo, useCallback, Suspense, memo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBalance } from 'wagmi';
import { useTipping } from '@/hooks/useTipping';
import { useTypedSelector, useAppDispatch } from '@/store/config/store';
import { setAudioEnabled, setVideoEnabled } from '@/store/media/slice';
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
    const router = useRouter();
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
            // Save the session code for after login
            localStorage.setItem('pendingSessionCode', id);
            // Redirect to home page
            router.replace('/');
            // Show informative message
            toast('Authentication required', {
                icon: '🔐',
                duration: 5000,
            });
            console.log('Redirecting from pod page - user not authenticated', { authenticated, isLoggedIn });
            return;
        }

        // Set the flag so we don't redirect after authentication
        authChecked.current = true;
    }, [authenticated, isLoggedIn, id, router]);

    // Second check that waits for Privy to be ready
    useEffect(() => {
        if (ready && !authChecked.current) {
            if (!authenticated || !isLoggedIn) {
                // Save the session code for after login
                localStorage.setItem('pendingSessionCode', id);
                // Redirect to home page
                router.replace('/');
                // Show informative message
                toast('Please login to join this session', {
                    icon: '🔐',
                    duration: 5000,
                });
                return;
            }
        }
    }, [ready, authenticated, isLoggedIn, id, router]);

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

    // Use media settings from the Redux store
    const { isAudioEnabled, isVideoEnabled } = useTypedSelector(state => state.media);
    const dispatch = useAppDispatch();
    
    // Track if we've already applied initial settings
    const initialSettingsApplied = useRef(false);
    
    // This effect should run with higher priority than other effects
    useEffect(() => {
        if (!call || !callingState) return;
        
        // Only run this when the call state changes to JOINED
        if (callingState === CallingState.JOINED && !initialSettingsApplied.current) {
            // Get settings from localStorage (these take priority over Redux)
            const storedAudioEnabled = localStorage.getItem('podMeetingJoiningWithAudio');
            const storedVideoEnabled = localStorage.getItem('podMeetingJoiningWithVideo');
            
            // Parse localStorage values or use Redux state as fallback
            const audioEnabled = storedAudioEnabled !== null ? 
                storedAudioEnabled === 'true' : isAudioEnabled;
            const videoEnabled = storedVideoEnabled !== null ? 
                storedVideoEnabled === 'true' : isVideoEnabled;
            
            console.log('Applying saved media settings in meeting page:', { 
                fromRedux: { isAudioEnabled, isVideoEnabled },
                fromLocalStorage: { storedAudioEnabled, storedVideoEnabled },
                usingValues: { audioEnabled, videoEnabled }
            });
            
            initialSettingsApplied.current = true;
            
            // Apply the media settings synchronously to ensure they're applied before any other operations
            const applySettings = async () => {
                try {
                    // Update Redux to match our final values
                    dispatch(setAudioEnabled(audioEnabled));
                    dispatch(setVideoEnabled(videoEnabled));
                    
                    // Apply audio settings first
                    if (audioEnabled) {
                        await call.microphone.enable();
                        console.log('Successfully enabled microphone in meeting page');
                    } else {
                        await call.microphone.disable();
                        console.log('Successfully disabled microphone in meeting page');
                    }
                    
                    // Then apply video settings
                    if (videoEnabled) {
                        await call.camera.enable();
                        console.log('Successfully enabled camera in meeting page');
                    } else {
                        await call.camera.disable();
                        console.log('Successfully disabled camera in meeting page');
                    }
                    
                    // Clear localStorage values as they're no longer needed
                    localStorage.removeItem('podMeetingJoiningWithAudio');
                    localStorage.removeItem('podMeetingJoiningWithVideo');
                    
                    console.log('Final media state in meeting page:', {
                        microphone: call.microphone?.enabled,
                        camera: call.camera?.enabled
                    });
                } catch (error) {
                    console.error('Error applying media settings in meeting page:', error);
                }
            };
            
            // Execute immediately
            applySettings();
        }
    }, [call, callingState, isAudioEnabled, isVideoEnabled, dispatch]);

    useEffect(() => {
        const startup = async () => {
            if (isUnkownOrIdle) {
                router.push(`/pod/join/${id}`);
                return;
            }
        };

        startup();
    }, [call, router, id, isUnkownOrIdle]);

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
            // Don't force microphone state, just redirect to join page
            console.log('Redirecting to join page without changing media state');
            router.push(`/pod/join/${id}`);
        }
    }, [id, callingState, call, connectedUser, router, live]);

    useEffect(() => {
        handleJoinSession();
    }, [handleJoinSession]);

    const leaveCall = async () => {
        try {
            if (call && 'leave' in call && callingState !== CallingState.OFFLINE) {
                await (call as unknown as Call).leave();
            }
            router.push(`/pod/end`);
        } catch (error) {
            console.error('Error leaving call:', error);
            router.push(`/pod/end`);
        }
    };

    const toggleScreenShare = useCallback(async () => {
        if (!call || !screenShare) {
            console.log('Call or screen share not available');
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
        router.push('/pod');
    };

    const updateParticipantRole = (userId: string, newRole: string) => {
        console.log(`Updating ${userId} to ${newRole}`);
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

    // Update the media initialization to respect user settings
    useEffect(() => {
        const initializeMedia = async () => {
            if (!call) return;

            try {
                // Get settings from localStorage
                const storedAudioEnabled = localStorage.getItem('podMeetingJoiningWithAudio');
                const storedVideoEnabled = localStorage.getItem('podMeetingJoiningWithVideo');
                
                // Use the stored values or fall back to Redux state
                const shouldEnableAudio = storedAudioEnabled !== null ? 
                    storedAudioEnabled === 'true' : isAudioEnabled;
                const shouldEnableVideo = storedVideoEnabled !== null ? 
                    storedVideoEnabled === 'true' : isVideoEnabled;
                
                console.log('Media settings in initializeMedia:', {
                    fromStorage: { storedAudioEnabled, storedVideoEnabled },
                    usingValues: { shouldEnableAudio, shouldEnableVideo }
                });
                
                // Apply the user's preferences instead of fixed settings
                if (shouldEnableAudio) {
                    await call.microphone.enable();
                    console.log('Microphone enabled in initializeMedia (respecting user preference)');
                } else {
                    await call.microphone.disable();
                    console.log('Microphone disabled in initializeMedia (respecting user preference)');
                }
                
                if (shouldEnableVideo) {
                    await call.camera.enable();
                    console.log('Camera enabled in initializeMedia (respecting user preference)');
                } else {
                    await call.camera.disable();
                    console.log('Camera disabled in initializeMedia (respecting user preference)');
                }

                // Setup speaker
                if (devices?.length > 0) {
                    await speaker.select(devices[0].deviceId);
                    speaker.setVolume(1.0);
                }

                // Update the Redux store to match what we applied
                dispatch(setAudioEnabled(shouldEnableAudio));
                dispatch(setVideoEnabled(shouldEnableVideo));
                
                console.log('Media devices initialized with user preferences');
            } catch (error) {
                console.error('Media initialization failed:', error);
            }
        };

        initializeMedia();
    }, [call, speaker, devices, isAudioEnabled, isVideoEnabled, dispatch]);

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
