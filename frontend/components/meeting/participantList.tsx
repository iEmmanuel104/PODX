'use client'

import React, { useState, useMemo } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, DollarSign, User2, UsersRound } from "lucide-react";
import { StreamVideoParticipant, OwnUserResponse } from "@stream-io/video-react-sdk";

interface ParticipantsSidebarProps {
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (participant: StreamVideoParticipant) => void;
    updateParticipantRole: (userId: string, newRole: string) => void;
    handleJoinRequest: (userId: string, accept: boolean) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
    participants,
    currentUser,
    openTipModal,
    updateParticipantRole,
    handleJoinRequest,
}) => {
    const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            const getRoleWeight = (roles: string[]) => {
                if (roles.includes("host")) return 3;
                if (roles.includes("cohost")) return 2;
                if (roles.includes("user")) return 1;
                return 0;
            };
            return getRoleWeight(b.roles) - getRoleWeight(a.roles);
        });
    }, [participants]);

    const ParticipantItem: React.FC<{ participant: StreamVideoParticipant }> = ({ participant }) => {
        const isCurrentUser = participant.userId === currentUser?.id;
        const role = participant.roles.includes("host")
            ? "host"
            : participant.roles.includes("cohost")
                ? "cohost"
                : participant.roles.includes("user")
                    ? "user"
                    : "listener";

        const isHostOrCohost = role === "host" || role === "cohost";

        const isAudioActive = participant.publishedTracks.includes(1);
        const isVideoActive = participant.publishedTracks.includes(2);

        return (
            <div
                className="bg-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors duration-200 relative"
            >
                <div className="flex items-center justify-between py-2 px-3 sm:py-3 sm:px-4">
                    <div className="flex items-center">
                        <div className="flex flex-col">
                            <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                                {participant.name || participant.userId}
                                {isCurrentUser && <span className="text-gray-400 text-xs ml-1">(You)</span>}
                            </span>
                            <span className="text-gray-400 text-xs hidden sm:inline">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isAudioActive ? "bg-[#7C3AED]" : "bg-red-500"
                                }`}
                        >
                            {isAudioActive ? (
                                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            ) : (
                                <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                        </div>
                        <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ml-1 sm:ml-2 ${isVideoActive ? "bg-[#7C3AED]" : "bg-red-500"
                                }`}
                        >
                            {isVideoActive ? (
                                <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            ) : (
                                <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                        </div>
                        <ChevronDown
                            className="w-4 h-4 text-gray-400 ml-1 sm:ml-2 cursor-pointer"
                            onClick={() => setExpandedParticipant(expandedParticipant === participant.userId ? null : participant.userId)}
                        />
                    </div>
                </div>
                {expandedParticipant === participant.userId && !isCurrentUser && (
                    <div className="flex justify-between p-2 rounded-b-lg">
                        {isHostOrCohost && (
                            <button
                                className="text-left text-white text-xs sm:text-sm py-0 px-4 bg-[#6032F6] rounded-full hover:bg-[#4C4C4C] flex items-center"
                                onClick={() => openTipModal(participant)}
                            >
                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                                Tip user
                            </button>
                        )}
                        <div className="bg-[#383838] flex items-center rounded-full px-3 py-1.5 gap-2">
                            <UsersRound className="text-yellow-500 h-6 w-6"/>
                            Request co-host
                        </div>
                        {currentUser?.role.includes("host") || currentUser?.role.includes("cohost") && role !== "host" && role !== "cohost" && (
                            <button
                                className="w-full text-left text-white text-xs sm:text-sm py-1 px-2 hover:bg-[#4C4C4C] rounded"
                                onClick={() => updateParticipantRole(participant.userId, "cohost")}
                            >
                                Promote to Co-host
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const pendingParticipants = sortedParticipants.filter((p) => p.roles.includes("pending"));

    return (
        <div className="w-full bg-[#1E1E1E] p-2 sm:p-4 mt-2 sm:mt-4 flex flex-col rounded-lg">
            <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center">
                Participants
                <span className="bg-[#7C3AED] text-white text-xs px-2 py-0.5 rounded-full ml-2">{sortedParticipants.length}</span>
            </h2>
            {pendingParticipants.length > 0 && (
                <div className="mb-2 sm:mb-4">
                    <h3 className="text-[#AFAFAF] text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Pending Requests</h3>
                    {pendingParticipants.map((participant) => (
                        <div key={participant.userId} className="flex items-center justify-between bg-[#2C2C2C] p-1 sm:p-2 rounded-lg mb-1 sm:mb-2">
                            <span className="text-white text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px]">
                                {participant.name || participant.userId}
                            </span>
                            <div>
                                <button
                                    className="bg-green-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded mr-1 sm:mr-2"
                                    onClick={() => handleJoinRequest(participant.userId, true)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="bg-red-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded"
                                    onClick={() => handleJoinRequest(participant.userId, false)}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <h2 className="text-[#AFAFAF] text-sm sm:text-medium font-semibold mb-2 sm:mb-4 mt-2 sm:mt-4 flex items-center">On the call</h2>
            <div className="flex-grow overflow-y-auto space-y-1 sm:space-y-2 max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-350px)]">
                {sortedParticipants
                    .filter((p) => !p.roles.includes("pending"))
                    .map((participant) => (
                        <ParticipantItem key={participant.sessionId} participant={participant} />
                    ))}
            </div>
        </div>
    );
};

export default ParticipantsSidebar;