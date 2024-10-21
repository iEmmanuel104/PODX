"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
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
    CustomVideoEvent,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useRouter } from "next/navigation";
import { useBalance } from "wagmi";
import { useSendTransaction } from "@privy-io/react-auth";
import { isAddress, parseEther } from "ethers";
import { useAppSelector } from "@/store/hooks";
import { StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { useSendTransaction as useSendTransactionWagmi } from "wagmi";
import toast, { Toaster } from "react-hot-toast";
import EndScreen from "@/components/meeting/end-screen";

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
    const customData = useCallCustomData();
    const live = useIsCallLive();
    const connectedUser = useConnectedUser();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const callingState = useCallCallingState();

    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState("");
    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [selectedTipRecipient, setSelectedTipRecipient] = useState<StreamVideoParticipant | null>(null);
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const { user } = useAppSelector((state) => state.user);
    const userAddress = user?.walletAddress as `0x${string}`;
    const [receivedTips, setReceivedTips] = useState<{ from: string; amount: string }[]>([]);

    // Sending the transaction
    const { sendTransaction: sendTransactionEmbedded } = useSendTransaction({
        onError: (error) => {
            console.error("Embedded wallet transaction failed:", error);
            toast.error("Transaction failed. Please try again.", { duration: 5000 });
        },
        onSuccess: (response) => {
            console.log("Embedded wallet transaction successful:", response);
            toast.success(`You successfully tipped ${selectedTipRecipient?.name || selectedTipRecipient?.userId} ${tipAmount} ETH`, {
                duration: 5000,
            });
        },
    });

    const walletClientType = useAppSelector((state) => state.user.user?.walletType);

    const isEmbeddedWallet = walletClientType === "privy";

    const { sendTransaction: sendTransactionWagmi, isSuccess, isPending, isError: isWagmiError } = useSendTransactionWagmi();

    useEffect(() => {
        if (isSuccess) {
            toast.success(`You successfully tipped ${selectedTipRecipient?.name || selectedTipRecipient?.userId} ${tipAmount} ETH`, {
                duration: 5000,
            });
        } else if (isPending) {
            toast.loading("Transaction pending...", { duration: 5000 });
        } else if (isWagmiError) {
            toast.error("Transaction failed. Please try again.", { duration: 5000 });
        }
    }, [isSuccess, isPending, isWagmiError]);

    const sendETHExternal = async (recipient: string, amount: string) => {
        console.log("external wallet tipping flow");
        const notification = toast.loading("Sending tip...", { duration: 9000 });

        try {
            if (!isAddress(recipient)) {
                throw new Error("Invalid recipient address");
            }
            const parsedAmount = parseEther(amount);

            if (sendTransactionWagmi) {
                await sendTransactionWagmi({
                    to: recipient as `0x${string}`,
                    value: parsedAmount,
                });
            } else {
                throw new Error("Transaction cannot be sent. Make sure you're connected to a wallet.");
            }
        } catch (error) {
            console.error("Error sending ETH:", error);
            toast.error("Failed to send tip. Please try again.", { id: notification });
        }
    };

    const sendETHEmbedded = async (recipient: string, amount: string) => {
        console.log("embedded tipping flow");
        const notification = toast.loading("Sending tip...", { duration: 9000 });
        try {
            if (!isAddress(recipient)) {
                throw new Error("Invalid recipient address");
            }
            const parsedAmount = parseEther(amount.toString());
            await sendTransactionEmbedded({
                chainId: 8453,
                to: recipient,
                value: parsedAmount,
                gasLimit: 21000,
            });
        } catch (error) {
            console.error("Error sending ETH:", error);
            toast.error("Failed to send tip. Please try again.", { id: notification });
        }
    };

    const sendETH = async (recipient: string, amount: string) => {
        if (isEmbeddedWallet) {
            await sendETHEmbedded(recipient, amount);
        } else {
            await sendETHExternal(recipient, amount);
        }
    };

    const sendTipEvent = useCallback(
        async (recipient: string, amount: string) => {
            if (!call) return;

            await call.sendCustomEvent({
                type: "tip",
                from: connectedUser?.id || "Unknown",
                to: recipient,
                amount: amount,
            });
        },
        [call, connectedUser]
    );

    const handleTip = async () => {
        if (selectedTipRecipient && tipAmount) {
            try {
                await sendETH((selectedTipRecipient?.custom?.fields?.walletAddress?.kind as any).stringValue || "0xaa", tipAmount);
                await sendTipEvent(selectedTipRecipient.userId, tipAmount);
                setShowTipModal(false);
            } catch (error) {
                console.error("Error sending tip:", error);
                toast.error("Failed to send tip. Please try again.");
            }
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
                case "custom":
                    const customEvent = event as CustomVideoEvent;
                    if (customEvent.custom.type === "tip") {
                        const { from, to, amount } = customEvent.custom;
                        if (to === connectedUser?.id) {
                            setReceivedTips((prev) => [...prev, { from, amount }]);
                            toast.success(`You received a tip of ${amount} ETH from ${from}`, { duration: 5000 });
                        }
                    }
                    break;
            }
        };

        const unsubscribe = call.on("all", handleCallEvent);

        return () => {
            unsubscribe();
        };
    }, [call, connectedUser]);

    const handleJoinSession = useCallback(() => {
        if (!call || !connectedUser) {
            console.log("Call or connected user not available");
            return;
        }

        const needsToJoin = [CallingState.IDLE, CallingState.UNKNOWN].includes(callingState);

        if (needsToJoin && !live) {
            console.log("User needs to join the call, redirecting to join page");
            router.push(`/pod/join/${id}`);
        } else if (callingState === CallingState.JOINED) {
            console.log("User is already in the call");
        } else {
            console.log(`Call is in ${callingState} state, waiting for it to complete`);
        }
    }, [id, callingState, call, connectedUser, router, live]);

    useEffect(() => {
        handleJoinSession();
    }, [handleJoinSession]);

    const handleCancelTip = () => {
        setShowTipModal(false);
        setTipAmount("");
        setSelectedTipRecipient(null);
    };

    const openTipModal = (participant: StreamVideoParticipant) => {
        console.log("person to tip is:", { participant })
        setSelectedTipRecipient(participant);
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
            <Toaster
                position="bottom-right"
                toastOptions={{
                    success: {
                        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
                        style: {
                            background: "#1E1E1E",
                            color: "#FFFFFF",
                            border: "1px solid #22C55E",
                        },
                    },
                    error: {
                        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                        style: {
                            background: "#1E1E1E",
                            color: "#FFFFFF",
                            border: "1px solid #EF4444",
                        },
                    },
                    loading: {
                        icon: <DollarSign className="w-5 h-5 text-yellow-500 animate-pulse" />,
                        style: {
                            background: "#1E1E1E",
                            color: "#FFFFFF",
                            border: "1px solid #EAB308",
                        },
                    },
                }}
            />
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

                    {showTipModal && selectedTipRecipient && (
                        <TipModal
                            selectedTipRecipient={selectedTipRecipient}
                            walletAddress={(selectedTipRecipient?.custom?.fields?.walletAddress?.kind as any).stringValue || "0xaaaaa"}
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
                        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md flex items-center text-xs sm:text-sm">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            You successfully tipped {selectedTipRecipient.name || selectedTipRecipient.userId} {tipAmount} ETH
                        </div>
                    )}

                    {receivedTips.length > 0 && (
                        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md">
                            Recent tips:{" "}
                            {receivedTips.map((tip, index) => (
                                <div key={index}>
                                    {tip.amount} ETH from {tip.from}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </StreamCall>
        </StreamTheme>
    );
}
