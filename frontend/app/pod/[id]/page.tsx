"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CheckCircle2, DollarSign } from "lucide-react";
import TipModal from "@/components/meeting/tips";
import ParticipantsSidebar from "@/components/meeting/participantList";
import ThankYouModal from "@/components/meeting/thankYou";
import Notifications from "@/components/meeting/notifications";
import Header from "@/components/meeting/header";
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
    CallingState,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useRouter } from "next/navigation";
import { useBalance } from "wagmi";
import { useSendTransaction } from "@privy-io/react-auth";
import { isAddress, parseEther } from "ethers";
import { useAppSelector } from "@/store/hooks";

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
    const { user } = useAppSelector((state) => state.user);
    const userAddress = user?.walletAddress as `0x${string}`;

    // Sending the transaction
    const { sendTransaction } = useSendTransaction({
        onError: (error) => {
            console.error("Transaction failed:", error);
        },
        onSuccess: (response) => {
            console.log("Transaction successful:", response);
            setShowTipSuccess(true);
            setTimeout(() => setShowTipSuccess(false), 3000);
        },
    });

    const sendETH = async (recipient: string, amount: string) => {
        try {
            // Validate recipient address
            if (!isAddress(recipient)) {
                throw new Error("Invalid recipient address");
            }
            const parsedAmount = parseEther(amount.toString());
            const tx = await sendTransaction({
                chainId: 8453,
                to: recipient,
                value: parsedAmount,
                gasLimit: 21000,
            });
            console.log("Transaction receipt:", tx);
        } catch (error) {
            console.error("Error sending ETH:", error);
        }
    };

    const {
        data: balance,
        isError,
        isLoading,
    } = useBalance({
        address: userAddress,
    });

    const formattedBalance = balance ? Number(balance.value) / 1e18 : 0;
    const displayBalance = formattedBalance.toFixed(4);

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

    const handleJoinSession = useCallback(async () => {
        if (id && callingState !== CallingState.JOINED) {
            try {
                await call?.join({
                    data: {
                        members: [{ user_id: connectedUser?.id!, role: "guest" }],
                    },
                });
                console.log("Successfully joined the call");
            } catch (error) {
                console.error("Error joining the call:", error);
            }
        }
    }, [id, callingState, call, connectedUser]);

    useEffect(() => {
        if (connectedUser && live && callingState !== CallingState.JOINED) {
            handleJoinSession();
        }
    }, [connectedUser, live, callingState, handleJoinSession]);

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
                    {/* Header Title */}
                    <Header
                        customData={customData}
                        live={live}
                        userAddress={userAddress}
                        displayBalance={displayBalance}
                        balanceSymbol={balance?.symbol}
                        toggleSidebar={toggleSidebar}
                        handleLogout={handleLogout}
                        copyAddress={copyAddress}
                    />

                    <div className="flex-grow flex overflow-hidden relative w-full px-2 sm:px-4">
                        <div className="flex-1 relative">{isSpeakerView ? <SpeakerLayout /> : <PaginatedGridLayout />}</div>
                        <div
                            className={`
                                ${showSidebar ? "translate-y-0" : "translate-y-full sm:translate-y-0"} 
                                transition-transform duration-300 ease-in-out
                                fixed sm:relative inset-0 sm:inset-auto top-16 sm:top-0 
                                h-screen sm:h-full w-full sm:w-56 lg:w-64 xl:w-80 
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

                    {/* Footer controls */}
                    <footer className="bg-[#1E1E1E] p-2 sm:p-4 flex justify-center items-center gap-2 sm:gap-4 h-16 sm:h-20">
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
                        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md flex items-center text-xs sm:text-sm">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            You successfully tipped {selectedTipRecipient} {tipAmount} USDC
                        </div>
                    )}
                </div>
            </StreamCall>
        </StreamTheme>
    );
}
