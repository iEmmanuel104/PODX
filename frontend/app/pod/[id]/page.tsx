"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Settings, CheckCircle2, Menu, LogOut, ChevronDown, Copy, LogOutIcon, DollarSign } from "lucide-react";
import TipModal from "@/components/meeting/tips";
import ParticipantsSidebar from "@/components/meeting/participantList";
import ThankYouModal from "@/components/meeting/thankYou";
import Notifications from "@/components/meeting/notifications";
import {
    StreamTheme,
    StreamCall,
    useCall,
    useCallStateHooks,
    useConnectedUser,
    StreamVideoEvent,
    PaginatedGridLayout,
    SpeakerLayout,
    CallControls,
} from "@stream-io/video-react-sdk";
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Channel, ChannelHeader, MessageInput, MessageList, useChatContext, Window } from "stream-chat-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/logo";
import { useAccount, useBalance } from 'wagmi'
import { Avatar, Identity, Name, Address } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth";
import { parseUnits, Interface, isAddress, parseEther } from 'ethers';
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

interface MeetingProps {
    params: {
        id: string;
    };
}

export default function MeetingInterface({ params }: MeetingProps) {
    const call = useCall();
    const { id } = params;
    const router = useRouter();
    const { useParticipants, useCallMembers, useIsCallLive, useCallCustomData, useHasOngoingScreenShare, useCallCallingState } = useCallStateHooks();

    const participants = useParticipants();
    const members = useCallMembers();
    const customData = useCallCustomData();
    const live = useIsCallLive();

    const connectedUser = useConnectedUser();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const callingState = useCallCallingState();
    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState("");
    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [selectedTipRecipient, setSelectedTipRecipient] = useState<string | null>(null);
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user } = usePrivy();
    const userAddress = user?.wallet?.address;
    const [showTipButton, setShowTipButton] = useState(false);

    // Sending the transaction
    const { sendTransaction } = useSendTransaction({
        onError: (error) => {
            console.error('Transaction failed:', error);
        },
        onSuccess: (response) => {
            console.log('Transaction successful:', response);
            setShowTipSuccess(true);
            setTimeout(() => setShowTipSuccess(false), 3000);
        }
    });

    const sendETH = async (recipient: string, amount: string) => {
        try {
            // Validate recipient address
            if (!isAddress(recipient)) {
                throw new Error('Invalid recipient address');
            }

            // Convert amount to smallest unit (ETH uses 18 decimals)
            const parsedAmount = parseEther(amount.toString()); // This converts the amount to wei            

            const tx = await sendTransaction({
                chainId: 8453, // Chain ID for Base mainnet
                to: recipient, // ETH recipient address
                value: parsedAmount, // ETH value in wei, converted to hex
                gasLimit: 21000, // Typical gas limit for ETH transfer
            });

            console.log("Transaction receipt:", tx);
        } catch (error) {
            console.error("Error sending ETH:", error);
        }
    };


    const { data: balance, isError, isLoading } = useBalance({
        address: userAddress,
    })
    const formattedBalance = balance ? Number(balance.value) / 1e18 : 0;
    const displayBalance = formattedBalance.toFixed(4);

    console.log({ userAddress })

    const isSpeakerView = useMemo(() => {
        return hasOngoingScreenShare || participants.length > 1;
    }, [hasOngoingScreenShare, participants.length]);

    useEffect(() => {
        if (!call) return;

        const handleCallEvent = (event: StreamVideoEvent) => {
            switch (event.type) {
                case "call.permission_request":
                    setSpeakRequests((prev) => [...prev, event.user.id]);
                    break;
                case "call.ring":
                    setJoinRequests((prev) => [...prev, event.user.id]);
                    break;
            }
        };

        const unsubscribe = call.on("all", handleCallEvent);

        return () => {
            unsubscribe();
        };
    }, [call]);

    const handleTip = async () => {
        if (selectedTipRecipient && tipAmount) {
            await sendETH("address here" as `0x${string}`, tipAmount);
            setShowTipModal(false);
        }
    };

    const openTipModal = (participantName: string) => {
        setSelectedTipRecipient(participantName);
        setShowTipModal(true);
    };

    const handleLeave = () => {
        setShowThankYouModal(true);
    };

    const confirmLeave = async () => {
        router.push("/pod");
    };

    const updateParticipantRole = (userId: string, newRole: string) => {
        // console.log(`Updating ${userId} to ${newRole}`);
    };

    const handleJoinRequest = (userId: string, accept: boolean) => {
        if (accept) {
            onAcceptJoin(userId);
        } else {
            onRejectJoin(userId);
        }
    };

    const onAcceptJoin = (user: string) => {
        setJoinRequests((prev) => prev.filter((u) => u !== user));
    };

    const onRejectJoin = (user: string) => {
        setJoinRequests((prev) => prev.filter((u) => u !== user));
    };

    const onAcceptSpeak = (user: string) => {
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
    };

    const onRejectSpeak = (user: string) => {
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = () => {
        // Implement logout logic here
    };

    const copyAddress = () => {
        // Implement copy to clipboard functionality
    };

    return (
        <StreamTheme className="root-theme">
            <StreamCall call={call}>
                <div className="h-screen bg-[#121212] text-white flex flex-col">
                    {/** Header Title*/}
                    <header className="flex justify-between items-center px-4 py-2 bg-[#1d1d1d] rounded-full w-[90%] mx-auto my-4">
                        <div className="flex items-center justify-between gap-4">
                            <img src="/logo.png" alt="Pod" className="w-full h-full border-r border-white pr-4" />
                            <p className="text-sm mr-2 hidden sm:inline w-full">{customData.title}</p>
                            <p className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{live ? "Live" : "Offline"}</p>
                        </div>
                        <div className="flex items-center">
                            <button
                                title="toggle sidebar"
                                className="text-[#A3A3A3] hover:text-white transition-colors sm:hidden mr-2 sm:mr-4"
                                onClick={toggleSidebar}
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="relative">
                                <div className="flex items-center">
                                    <button
                                        className="flex items-center text-[#A3A3A3] hover:text-white transition-colors mr-2 sm:mr-4"
                                        onClick={toggleProfileDropdown}
                                    >
                                        <Identity
                                            address={userAddress}
                                            chain={base}
                                            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                                        >
                                            <Avatar address={userAddress} chain={base} className="w-8 h-8 rounded-full mr-2" />
                                            <Name address={userAddress} chain={base} className="mr-2" />
                                        </Identity>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="flex justify-between items-center">
                                        <LogOutIcon className="w-4 h-4 text-red-500" />
                                        <button
                                            onClick={handleLogout}
                                            className="text-red-500 px-3 py-1 rounded hover:bg-[#3d3d3d] transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-[#2d2d2d] rounded-xl shadow-lg py-3 px-4 z-10">
                                        <div className="flex items-center">
                                            <Identity
                                                address={userAddress}
                                                chain={base}
                                                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                                            >
                                                <Avatar address={userAddress} chain={base} className="w-10 h-10 rounded-full mr-3" />
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Name address={userAddress} chain={base} className="text-white font-semibold" />
                                                        <p className="text-white text-sm bg-violet-500 rounded-full px-2 py-0.5">
                                                            {displayBalance} {balance?.symbol}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-[#1d1d1d] p-2 mb-2 rounded-full">
                                                        <img src="/images/base.png" alt="Base" className="w-6 h-6" />
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                            <Address address={userAddress} chain={base} className="text-[#A3A3A3] text-xs" />
                                                        </div>
                                                        <button onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Identity>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/** Main content */}
                    <div className="flex-grow flex overflow-hidden relative w-[90%] mx-auto">
                        <div
                            className="flex-1 hover:cursor-pointer w-fit h-fit relative"
                            onMouseEnter={() => setShowTipButton(true)}
                            onMouseLeave={() => setShowTipButton(false)}
                        >
                            {isSpeakerView ? <SpeakerLayout /> : <PaginatedGridLayout />}
                            {showTipButton && (
                                <button
                                    className="absolute top-4 right-8 bg-violet-500 text-white px-4 py-2 rounded-full flex items-center"
                                    onClick={() => openTipModal(connectedUser?.id || '')}
                                >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Tip
                                </button>
                            )}
                        </div>
                        <div
                            className={`
                                ${showSidebar ? "translate-y-0" : "translate-y-full sm:translate-y-0"} 
                                transition-transform duration-300 ease-in-out
                                fixed sm:relative inset-0 sm:inset-auto top-16 sm:top-0 
                                 h-screen sm:h-full w-full sm:w-64 lg:w-80 
                                bg-[#1E1E1E] sm:bg-transparent 
                                z-20 sm:z-auto
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

                    {/** Footer controls */}
                    <footer className="bg-[#1E1E1E] p-4 flex justify-center items-center gap-4 h-20">
                        <CallControls onLeave={handleLeave} />
                    </footer>
                    {showTipModal && (
                        <TipModal
                            selectedTipRecipient={selectedTipRecipient}
                            tipAmount={tipAmount}
                            setTipAmount={setTipAmount}
                            handleTip={handleTip}
                        />
                    )}

                    {showThankYouModal && <ThankYouModal onClose={confirmLeave} />}

                    <Notifications
                        joinRequests={joinRequests}
                        speakRequests={speakRequests}
                        onAcceptJoin={onAcceptJoin}
                        onRejectJoin={onRejectJoin}
                        onAcceptSpeak={onAcceptSpeak}
                        onRejectSpeak={onRejectSpeak}
                        callingState={callingState}
                    />

                    {showTipSuccess && (
                        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            You successfully tipped {selectedTipRecipient} {tipAmount} USDC
                        </div>
                    )}
                </div>
            </StreamCall>
        </StreamTheme>
    );
}

function useCallCallingState() {
    throw new Error("Function not implemented.");
}
