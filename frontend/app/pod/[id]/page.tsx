"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Settings, CheckCircle2, Menu, LogOut, ChevronDown, Copy, LogOutIcon } from "lucide-react";
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
// import CustomRingingCall from "@/components/meeting/customRingingCall";

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
    console.log({ participants, members });
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

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = () => {
        // Implement logout logic here
        console.log("Logging out...");
    };

    const copyAddress = () => {
        // Implement copy to clipboard functionality
        console.log("Address copied to clipboard");
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
                                        <img src="/avatar-placeholder.png" alt="Profile" className="w-8 h-8 rounded-full mr-2" />
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
                                            <img src="/avatar-placeholder.png" alt="Profile" className="w-10 h-10 rounded-full mr-3" />
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-white font-semibold">folajindayo.base.eth</p>
                                                    <p className="text-wwhite text-sm bg-violet-500 rounded-full px-2 py-0.5">$2.11</p>
                                                </div>
                                                <div className="flex items-center justify-between bg-[#1d1d1d] p-2 mb-2 rounded-full">
                                                    <img src="/base-logo.png" alt="Base" className="w-6 h-6" />
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                        <span className="text-[#A3A3A3] text-xs">0xd23D4...d95d20</span>
                                                    </div>
                                                    <button onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/** Main content */}
                    <div className="flex-grow flex overflow-hidden relative w-[90%] mx-auto">
                        <div className="flex-1 hover:cursor-pointer w-fit h-fit">
                            {isSpeakerView ? <SpeakerLayout /> : <PaginatedGridLayout />}
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
                    {/* <CustomRingingCall showMemberCount={3} /> */}
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
