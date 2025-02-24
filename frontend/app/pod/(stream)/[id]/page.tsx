//app/pod/[id]/page.tsx
'use client';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import React, { useState, useEffect, useMemo, useCallback, Suspense, memo } from 'react';
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

interface MeetingProps {
    params: {
        id: string;
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
    TipNotification: React.lazy(() => import('@/components/meeting/tip-notification'))
};

// Create a loading fallback component
const ComponentLoader = memo(() => (
    <div className="animate-pulse bg-gray-800 rounded-lg h-full w-full" />
));
ComponentLoader.displayName = 'ComponentLoader';

// Memoize the main interface component
const MeetingInterface = memo(({ params }: MeetingProps) => {
    const call = useStreamCall();
    const { id } = params;
    const router = useRouter();
    const {
        useCallMembers,
        useParticipants,
        useIsCallLive,
        useCallCustomData,
        useCallCallingState,
        useScreenShareState,
    } = useCallStateHooks();

    const participantComparator = useMemo(() => {
        return combineComparators(
            // First sort by screen sharing
            (a, b) => hasScreenShare(b) ? 1 : hasScreenShare(a) ? -1 : 0,
            // Then by pinned status
            (a, b) => isPinned(b) ? 1 : isPinned(a) ? -1 : 0,
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

    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);
    const { user } = useTypedSelector(state => state.auth);
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
        if (!call) return;

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

    // Update the event handler with proper type checking
    const handleCallEvent: CallEventHandler = (event) => {
        switch (event.type) {
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
            case 'custom': {
                handleTipEvent(event as CustomVideoEvent);
                break;
            }
        }
    };

    useEffect(() => {
        if (!call || !('on' in call)) return;
        
        const unsubscribe = (call as unknown as Call).on('all', handleCallEvent);
        return () => unsubscribe();
    }, [call, handleTipEvent]);

    const handleJoinSession = useCallback(() => {
        if (!call || !connectedUser) {
            console.log('Call or connected user not available');
            return;
        }

        const needsToJoin = [CallingState.IDLE, CallingState.UNKNOWN].includes(callingState);

        if (needsToJoin && !live) {
            console.log('User needs to join the call, redirecting to join page');
            router.push(`/pod/join/${id}`);
        } else if (callingState === CallingState.JOINED) {
            console.log('User is already in the call');
        } else {
            console.log(`Call is in ${callingState} state, waiting for it to complete`);
        }
    }, [id, callingState, call, connectedUser, router, live]);

    useEffect(() => {
        handleJoinSession();
    }, [handleJoinSession]);

    const leaveCall = async () => {
        if (call && 'leave' in call) {
            await (call as unknown as Call).leave();
        }
        router.push(`/pod/end`);
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
                import('@/components/pod/speakerLayout')
            ];
            await Promise.all(imports);
        };
        preloadComponents();
    }, []);

    return (
        <StreamTheme className="root-theme">
            <div className="min-h-screen max-h-screen bg-[#151515] text-white flex flex-col">
                {/* Header with proper mobile padding */}
                <div className="px-3 sm:px-4 md:px-6">
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
                </div>

                {/* Main content area */}
                <div className={clsx(
                    "flex-1 flex relative",
                    "mb-[60px] sm:mb-20",
                    "min-h-0", // Important for nested flex containers
                    "overflow-hidden"
                )}>
                    {/* Video grid container */}
                    <div className={clsx(
                        'flex-1',
                        'transition-all duration-300 ease-in-out',
                        'min-w-0 min-h-0', // Prevent flex item overflow
                        'px-3 sm:px-4 md:px-6',
                        showParticipants ? 'sm:mr-[320px]' : ''
                    )}>
                        <Suspense fallback={<ComponentLoader />}>
                            <div className="h-full">
                                {layoutType === 'speaker' 
                                    ? <DynamicComponents.SpeakerLayout /> 
                                    : <DynamicComponents.GridLayout />
                                }
                            </div>
                        </Suspense>
                    </div>

                    {/* Participants sidebar */}
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
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 px-3 sm:px-4 md:px-6 bg-[#151515]">
                    <Suspense fallback={<ComponentLoader />}>
                        <DynamicComponents.MeetingFooter
                            leaveCall={leaveCall}
                            toggleScreenShare={toggleScreenShare}
                            customData={customData}
                        />
                    </Suspense>
                </div>

                {/* Modals and notifications with proper z-index */}
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div className="relative h-full">
                        {showTipModal && selectedTipRecipient && (
                            <Suspense fallback={null}>
                                <div className="pointer-events-auto">
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
                                </div>
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
                </div>
            </div>
        </StreamTheme>
    );
});

MeetingInterface.displayName = 'MeetingInterface';

export default MeetingInterface;
