"use client";

import React, { useState } from "react";
import { Mic, Video, PhoneOff, Settings, CheckCircle2, XCircle, DollarSign, User, MessageSquare } from "lucide-react";
import TipModal from "@/components/meeting/tips";
import ParticipantsSidebar from "@/components/meeting/participantList";
import LeaveConfirmationModal from "@/components/meeting/leave-confirm";
import Notifications from "@/components/meeting/notifications";

export default function MeetingInterface() {
    const [participants, setParticipants] = useState<Participant[]>([
        { name: "folajindayo.base.eth", role: "host", isMuted: false },
        { name: "Jane Doe", role: "co-host", isMuted: true },
        ...Array(20).fill({ name: "Listener", role: "listener", isMuted: true }),
    ]);
    const [currentUser, setCurrentUser] = useState<Participant>({ name: "Current User", role: "listener", isMuted: true });
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState("");
    const [showTipSuccess, setShowTipSuccess] = useState(false);
    const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
    const [selectedTipRecipient, setSelectedTipRecipient] = useState<string | null>(null);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [joinRequests, setJoinRequests] = useState<string[]>([]);
    const [speakRequests, setSpeakRequests] = useState<string[]>([]);

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

    const confirmLeave = () => {
        // Handle leaving the session
        setShowLeaveConfirmation(false);
    };

    const handleJoinRequest = () => {
        setJoinRequests((prev) => [...prev, "folajindayo.base.eth"]);
    };

    const handleSpeakRequest = () => {
        setSpeakRequests((prev) => [...prev, "folajindayo.base.eth"]);
    };

    const onAcceptJoin = (user: string) => {
        // Logic to accept join request
        setJoinRequests((prev) => prev.filter((u) => u !== user));
        // Add user to participants list
        setParticipants((prev) => [...prev, { name: user, role: "listener", isMuted: true }]);
    };

    const onRejectJoin = (user: string) => {
        // Logic to reject join request
        setJoinRequests((prev) => prev.filter((u) => u !== user));
    };

    const onAcceptSpeak = (user: string) => {
        // Logic to accept speak request
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
        // Change user's role to speaker
        setParticipants((prev) => prev.map((p) => (p.name === user ? { ...p, role: "co-host" } : p)));
    };

    const onRejectSpeak = (user: string) => {
        // Logic to reject speak request
        setSpeakRequests((prev) => prev.filter((u) => u !== user));
    };

    return (
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
                <div className="flex-grow p-4">
                    <div className="h-full relative bg-[#2C2C2C] rounded-lg overflow-hidden">
                        <img src="/images/woman.png" alt="Current speaker" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-[#7C3AED] text-white text-xs py-1 px-2 rounded-full">Muted</div>
                        {hoveredParticipant === "folajindayo.base.eth" && currentUser.role === "listener" && (
                            <button
                                className="absolute bottom-4 right-4 bg-[#2C2C2C] text-white text-sm py-2 px-4 rounded-full flex items-center"
                                onClick={() => openTipModal("folajindayo.base.eth")}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Tip
                            </button>
                        )}
                    </div>
                </div>

                <ParticipantsSidebar
                    participants={participants}
                    currentUser={currentUser}
                    // hoveredParticipant={hoveredParticipant}
                    // setHoveredParticipant={setHoveredParticipant}
                    openTipModal={openTipModal}
                />
            </div>

            {/** Footer controls */}
            <footer className="bg-[#1E1E1E] p-4 flex justify-center items-center gap-4 h-20">
                <button
                    title="mute"
                    className={`p-3 rounded-full ${isMuted ? "bg-red-500" : "bg-[#2C2C2C]"} hover:bg-opacity-80 transition-colors`}
                    onClick={() => setIsMuted(!isMuted)}
                >
                    <Mic className="w-6 h-6" />
                </button>
                <button
                    title="video"
                    className={`p-3 rounded-full ${isVideoOn ? "bg-[#2C2C2C]" : "bg-red-500"} hover:bg-opacity-80 transition-colors`}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                >
                    <Video className="w-6 h-6" />
                </button>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center hover:bg-opacity-80 transition-colors"
                    onClick={handleLeave}
                >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Leave
                </button>
            </footer>
                
            {/* tip modals */}
            {showTipModal && (
                <TipModal selectedTipRecipient={selectedTipRecipient} tipAmount={tipAmount} setTipAmount={setTipAmount} handleTip={handleTip} />
            )}

            {/* leave modals */}
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
    );
}
