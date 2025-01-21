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
    useCallStateHooks,
    useConnectedUser,
    StreamVideoEvent,
    CallingState,
    CustomVideoEvent,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import { useBalance } from 'wagmi';
import { useAppSelector } from '@/store/hooks';
import EndScreen from '@/components/meeting/end-screen';
import Image from 'next/image';
import { useTipping } from '@/hooks/useTipping';
import SpeakerLayout from '@/components/pod/speakerLayout';
import GridLayout from '@/components/pod/gridLayout';
import ToggleAudioButton from '@/components/pod/toggleAudioButton';
import ToggleVideoButton from '@/components/pod/toggleVideoButton';
import CallControlButton from '@/components/pod/callControlButton';
import Mood from '@/components/icons/Mood';
import PresentToAll from '@/components/icons/PresentToAll';
import CallEndFilled from '@/components/icons/CallEndFilled';
import MeetingFooter from '@/components/meeting/meetingFooter';

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
        useParticipants,
        useIsCallLive,
        useCallCustomData,
        useHasOngoingScreenShare,
        useCallCallingState,
        useScreenShareState,
    } = useCallStateHooks();

    const participants = useParticipants();
    const customData = useCallCustomData();
    const live = useIsCallLive();
    const { screenShare } = useScreenShareState();
    const connectedUser = useConnectedUser();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const callingState = useCallCallingState();

    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const { user } = useAppSelector(state => state.user);
    const userAddress = user?.walletAddress as `0x${string}`;
    const walletClientType = useAppSelector(state => state.user.user?.walletType);
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

    const isSpeakerView = useMemo(() => {
        return hasOngoingScreenShare || participants.length > 1;
    }, [hasOngoingScreenShare, participants.length]);

    useEffect(() => {
        const startup = async () => {
            if (isUnkownOrIdle) {
                router.push(`/pod/join/${id}`);
            }
            //   else if (chatClient) {
            //       const channel = chatClient.channel('messaging', meetingId);
            //       setChatChannel(channel);
            //   }
        };
        startup();
        //   }, [router, meetingId, isUnkownOrIdle, chatClient]);
    }, [router, id, isUnkownOrIdle]);

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

    const handleLeave = () => {
        router.push('/pod/end');
        // setShowThankYouModal(true);
    };

    const leaveCall = async () => {
        await call?.leave();
        router.push(`/pod/end`);
    };

    const toggleScreenShare = async () => {
        try {
            await screenShare.toggle();
        } catch (error) {
            console.error(error);
        }
    };

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

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const handleLogout = () => {
        // Implement logout logic here
    };

    const copyAddress = () => {
        // Implement copy to clipboard functionality
    };

    return (
        <StreamTheme className="root-theme">
            <div className="h-screen bg-[#121212] text-white flex flex-col w-[95%] mx-auto">
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
                        {isSpeakerView && <SpeakerLayout />}
                        {!isSpeakerView && <GridLayout />}
                    </div>

                    {/* Participants sidebar */}
                    <div
                        className={`
                            fixed sm:absolute right-0 top-0 h-full
                            w-full sm:w-56 lg:w-64 xl:w-80
                            bg-[#1E1E1E] 
                            transform transition-transform duration-300 ease-in-out
                            ${showParticipants ? 'translate-x-0' : 'translate-x-full'}
                            z-20
                            overflow-y-auto
                        `}
                    >
                        <ParticipantsSidebar
                            participants={participants}
                            currentUser={connectedUser}
                            openTipModal={openTipModal}
                            updateParticipantRole={updateParticipantRole}
                            handleJoinRequest={handleJoinRequest}
                        />
                    </div>
                </div>

                {/* New Footer Component */}
                <MeetingFooter leaveCall={leaveCall} toggleScreenShare={toggleScreenShare} />
                {showTipModal && selectedTipRecipient && (
                    <TipModal
                        selectedTipRecipient={selectedTipRecipient}
                        walletAddress={
                            (selectedTipRecipient?.custom?.fields?.walletAddress?.kind as any)
                                .stringValue || '0xaaaaa'
                        }
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
                        {selectedTipRecipient.name || selectedTipRecipient.userId} {tipAmount} ETH
                    </div>
                )}
                {receivedTips.length > 0 && (
                    <div className="fixed bottom-4 left-4 text-white px-4 py-2">
                        {/* Recent tips:{" "} */}
                        {receivedTips.map((tip, index) => (
                            <div
                                key={index}
                                className="bg-[#6032F6] rounded-full flex items-center justify-between gap-2 px-2"
                            >
                                <Image
                                    src={'/images/confetti.svg'}
                                    alt="confetti"
                                    className="h-10"
                                    width={30}
                                    height={10}
                                />
                                <div className="flex items-center gap-2">
                                    <p className="text-semibold">{tip.from}</p> tipped you{' '}
                                    <p className="text-semibold">{tip.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StreamTheme>
    );
}
