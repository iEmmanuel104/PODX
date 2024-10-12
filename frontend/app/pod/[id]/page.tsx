"use client";
import React, { useState, useEffect, useMemo } from "react";
import { PhoneOff, Settings, CheckCircle2 } from "lucide-react";
import TipModal from "@/components/meeting/tips";
import ParticipantsSidebar from "@/components/meeting/participantList";
import LeaveConfirmationModal from "@/components/meeting/leave-confirm";
import Notifications from "@/components/meeting/notifications";
import {
    StreamTheme,
    useCall,
    useCallStateHooks,
    useConnectedUser,
    StreamVideoEvent,
    PaginatedGridLayout,
    SpeakerLayout,
    CallControls,
} from "@stream-io/video-react-sdk";


interface MeetingProps {
    params: {
        id: string;
    };
}

export default function MeetingInterface({ params }: MeetingProps) {
    const call = useCall();
  const { id } = params;
    console.log({ callMeetPage: call, id });
    const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const participants = useParticipants();
    const connectedUser = useConnectedUser();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    // const callingState = useCallCallingState();

    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState("");
    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [selectedTipRecipient, setSelectedTipRecipient] = useState<string | null>(null);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
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
        setShowLeaveConfirmation(true);
    };

    const confirmLeave = async () => {
        await call?.leave();
        setShowLeaveConfirmation(false);
        // Redirect to end meeting page or home
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
            <div className="h-screen bg-[#121212] text-white flex flex-col">
                {/** Header Title*/}
                <header className="flex justify-between items-center p-4 h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold mr-4">
                            Pod<span className="text-[#7C3AED]">X</span>
                        </h1>
                        <span className="text-sm mr-2">Base Live Build Session</span>
                        <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">Live</span>
                    </div>
                    <button title="settings" className="text-[#A3A3A3] hover:text-white transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                </header>

                {/** Main content */}
                <div className="flex-grow flex overflow-hidden">
                    <div className="flex-grow p-4">{isSpeakerView ? <SpeakerLayout /> : <PaginatedGridLayout />}</div>
                    <ParticipantsSidebar participants={participants} currentUser={connectedUser} openTipModal={openTipModal} />
                </div>

                {/** Footer controls */}
                <footer className="bg-[#1E1E1E] p-4 flex justify-center items-center gap-4 h-20">
                    <CallControls onLeave={handleLeave} />
                </footer>

                {/* Modals and Notifications */}
                {showTipModal && (
                    <TipModal selectedTipRecipient={selectedTipRecipient} tipAmount={tipAmount} setTipAmount={setTipAmount} handleTip={handleTip} />
                )}

                {showLeaveConfirmation && <LeaveConfirmationModal setShowLeaveConfirmation={setShowLeaveConfirmation} confirmLeave={confirmLeave} />}

                <Notifications
                    joinRequests={joinRequests}
                    speakRequests={speakRequests}
                    onAcceptJoin={onAcceptJoin}
                    onRejectJoin={onRejectJoin}
                    onAcceptSpeak={onAcceptSpeak}
                    onRejectSpeak={onRejectSpeak}
                />

                {/* Tip success notification */}
                {showTipSuccess && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        You successfully tipped {selectedTipRecipient} {tipAmount} USDC
                    </div>
                )}
            </div>
        </StreamTheme>
    );
}
