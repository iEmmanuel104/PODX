//app/pod/[id]/page.tsx
'use client';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import TipModal from '@/components/meeting/tips';
import ParticipantsSidebar from '@/components/meeting/participantList';
import Notifications from '@/components/meeting/notifications';
import Header from '@/components/meeting/header';
import {
    StreamTheme,
    useCall,
    Comparator,
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
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import { useBalance } from 'wagmi';
import EndScreen from '@/components/meeting/end-screen';
import { useTipping } from '@/hooks/useTipping';
import SpeakerLayout from '@/components/pod/speakerLayout';
import GridLayout from '@/components/pod/gridLayout';
import MeetingFooter from '@/components/meeting/meetingFooter';
import { useTypedSelector } from '@/store/config/store';
import TipNotification from '@/components/meeting/tip-notification';

interface MeetingProps {
    params: {
        id: string;
    };
}

export default function MeetingInterface({ params }: MeetingProps) {
    const call = useCall();
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
            // Sort by role first (host -> cohost -> user -> listener)
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

    console.log({callmembers: members});
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
        openTipModal,
        handleTip,
        handleCancelTip,
        setTipAmount,
        handleTipEvent,
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

    const toggleParticipants = () => {
        setShowParticipants(!showParticipants);
    };

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

    useEffect(() => {
        if (!call) return;

        const handleCallEvent = (event: StreamVideoEvent) => {
            switch (event.type) {
                case 'call.permission_request':
                    setSpeakRequests(prev => [...prev, event.user.id]);
                    break;
                case 'call.ring':
                    setJoinRequests(prev => [...prev, event.user.id]);
                    break;
                case 'custom':
                    handleTipEvent(event as CustomVideoEvent);
                    break;
            }
        };

        const unsubscribe = call.on('all', handleCallEvent);
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
        await call?.leave();
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

    return (
        <StreamTheme className="root-theme">
            <div className="h-screen bg-[#151515] text-white flex flex-col w-[95%] mx-auto">
                <Header
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

                {/* Main content area */}
                <div className="flex-grow flex overflow-hidden relative mb-20">
                    <div
                        className={`flex-1 relative ${showParticipants ? 'sm:mr-56 lg:mr-64 xl:mr-80' : ''}`}
                    >
                        {isSpeakerLayout && <SpeakerLayout />}
                        {!isSpeakerLayout && <GridLayout />}
                    </div>

                    {/* Participants sidebar */}
                    <div
                        className={`
                            fixed sm:absolute right-0 top-0 h-full
                            w-full sm:w-56 lg:w-64 xl:w-80
                            bg-inherit
                            transform transition-transform duration-300 ease-in-out
                            ${showParticipants ? 'translate-x-0' : 'translate-x-full'}
                            z-20
                            overflow-y-auto
                        `}
                    >
                        <ParticipantsSidebar
                            members={members}
                            participants={participants}
                            currentUser={connectedUser}
                            openTipModal={openTipModal}
                            updateParticipantRole={updateParticipantRole}
                            handleJoinRequest={handleJoinRequest}
                        />
                    </div>
                </div>

                {/* New Footer Component */}
                <MeetingFooter
                    leaveCall={leaveCall}
                    toggleScreenShare={toggleScreenShare}
                    customData={customData}
                />
                {showTipModal && selectedTipRecipient && (
                    <TipModal
                        selectedTipRecipient={selectedTipRecipient}
                        walletAddress={selectedTipRecipient.user.custom.walletAddress}
                        tipAmount={tipAmount}
                        setTipAmount={setTipAmount}
                        handleTip={handleTip}
                        onCancel={handleCancelTip}
                        balance={displayBalance}
                    />
                )}
                {showThankYouModal && <EndScreen onClose={confirmLeave} user={user} />}
                <Notifications
                    joinRequests={joinRequests}
                    speakRequests={speakRequests}
                    onAcceptJoin={onAcceptJoin}
                    onRejectJoin={onRejectJoin}
                    onAcceptSpeak={onAcceptSpeak}
                    onRejectSpeak={onRejectSpeak}
                    callingState={callingState}
                />
                {showTipSuccess && selectedTipRecipient && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-[10px] flex items-center text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        You successfully tipped{' '}
                        {selectedTipRecipient.user.name} {tipAmount} ETH
                    </div>
                )}
                {receivedTips.length > 0 &&
                    receivedTips.map((tip, index) => (
                        <TipNotification
                            key={index}
                            tip={{
                                from: tip.from,
                                amount: `${tip.amount} USDC`,
                                profileImage: "/images/default-avatar.png",
                            }}
                            onClose={() => {
                                // Remove this specific tip from receivedTips array
                                const newTips = [...receivedTips]
                                newTips.splice(index, 1)
                                // Update your tips state here -  This needs to be implemented with useState hook
                                // Example: setReceivedTips(newTips);
                            }}
                            onAppreciate={() => {
                                // Handle appreciation logic
                                console.log(`Appreciated tip from ${tip.from}`)
                                // Remove tip after appreciation
                                const newTips = [...receivedTips]
                                newTips.splice(index, 1)
                                // Update your tips state here - This needs to be implemented with useState hook
                                // Example: setReceivedTips(newTips);
                            }}
                        />
                    ))}
            </div>
        </StreamTheme>
    );
}
