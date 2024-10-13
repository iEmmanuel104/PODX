"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Settings, CheckCircle2 } from "lucide-react";
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
import { Channel, ChannelHeader, MessageInput, MessageList, useChatContext, Window } from "stream-chat-react";
import { useRouter } from "next/navigation";

interface MeetingProps {
    params: {
        id: string;
    };
}

export default function MeetingInterface({ params }: MeetingProps) {
    const call = useCall();
    const { id } = params;
    const router = useRouter();
    console.log({ callMeetPage: call });
    const { useParticipants, useCallMembers, useIsCallLive, useCallCustomData, useHasOngoingScreenShare, useCallCallingState } = useCallStateHooks();

    const participants = useParticipants();
    const members = useCallMembers();
    const customData = useCallCustomData();
    const live = useIsCallLive();

    console.log({ participants, members, customData });
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
                // ... other event handlers remain the same
            }
        };

        const unsubscribe = call.on("all", handleCallEvent);

        return () => {
            unsubscribe();
        };
    }, [call]);

    const handleTip = () => {
        setShowTipModal(false);
        setShowTipSuccess(true);
        setTimeout(() => setShowTipSuccess(false), 3000);
    };

    const openTipModal = (participantName: string) => {
        setSelectedTipRecipient(participantName);
        setShowTipModal(true);
    };

    const handleLeave = () => {
        setShowThankYouModal(true);
    };

    const confirmLeave = async () => {
        // await call?.leave();
        // setShowThankYouModal(false);
        // Redirect to end meeting page or home
        router.push("/landing");
    };

    const updateParticipantRole = (userId: string, newRole: string) => {
        // Implement the logic to update the participant's role
        console.log(`Updating ${userId} to ${newRole}`);
        // You might need to call an API or update the state here
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
        console.log(`Accepted join request for ${user}`);
    };

    const onRejectJoin = (user: string) => {
        setJoinRequests((prev) => prev.filter((u) => u !== user));
    };

    const onAcceptSpeak = (user: string) => {
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
        console.log(`Accepted speak request for ${user}`);
    };

    const onRejectSpeak = (user: string) => {
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
    };

    return (
        <StreamTheme className="root-theme">
            <StreamCall call={call}>
                <div className="h-screen bg-[#121212] text-white flex flex-col">
                    {/** Header Title*/}
                    <header className="flex justify-between items-center p-4 h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold mr-4">
                                Pod<span className="text-[#7C3AED]">X</span>
                            </h1>
                            <span className="text-sm mr-2">{customData.title}</span>
                            <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{live ? "Live" : "Offline"}</span>
                        </div>
                        <button title="settings" className="text-[#A3A3A3] hover:text-white transition-colors">
                            <Settings className="w-6 h-6" />
                        </button>
                    </header>

                    {/** Main content */}
                    <div className="flex-grow flex overflow-hidden">
                        <div className="flex-grow p-4">{isSpeakerView ? <SpeakerLayout /> : <PaginatedGridLayout />}</div>
                        <ParticipantsSidebar
                            participants={participants}
                            currentUser={connectedUser}
                            openTipModal={openTipModal}
                            updateParticipantRole={updateParticipantRole}
                            handleJoinRequest={handleJoinRequest}
                        />
                    </div>

                    {/** Footer controls */}
                    <footer className="bg-[#1E1E1E] p-4 flex justify-center items-center gap-4 h-20">
                        <CallControls onLeave={handleLeave} />
                    </footer>

                    {/* Modals and Notifications */}
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

                    {/* Tip success notification */}
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
