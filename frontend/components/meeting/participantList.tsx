"use client";

import React, { useState, useMemo, memo } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, DollarSign, UsersRound } from "lucide-react";
import { StreamVideoParticipant, OwnUserResponse } from "@stream-io/video-react-sdk";

// Types
interface ParticipantsSidebarProps {
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (participant: StreamVideoParticipant) => void;
    updateParticipantRole: (userId: string, newRole: string) => void;
    handleJoinRequest: (userId: string, accept: boolean) => void;
}

const formatName = (name: string, maxLength: number = 15): string => {
    if (!name) return "";
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
};

const Tooltip = memo<{ content: string; children: React.ReactNode }>(({ content, children }) => (
    <div className="group relative inline-block">
        {children}
        <div
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs 
                      bg-black text-white rounded opacity-0 invisible group-hover:opacity-100 
                      group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
        >
            {content}
            <div
                className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 
                          border-transparent border-t-black"
            />
        </div>
    </div>
));


const ActionButton = memo<{
    icon: React.ReactNode;
    text: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    className?: string;
}>(({ icon, text, onClick, variant = "primary", className = "" }) => (
    <Tooltip content={text}>
        <button
            onClick={onClick}
            className={`flex items-center space-x-1 px-2.5 py-1.5
                ${variant === "primary" ? "bg-[#6032F6] hover:bg-[#4C28C4]" : "bg-[#383838] hover:bg-[#424242]"}
                transition-colors duration-200 rounded-full
                text-white text-xs ${className}`}
        >
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </button>
    </Tooltip>
));

// Memoized Sub-components
const ParticipantControls = memo<{
    isAudioActive: boolean;
    isVideoActive: boolean;
    onExpandClick: () => void;
    showControls: boolean; // New prop to control visibility
}>(({ isAudioActive, isVideoActive, onExpandClick, showControls }) => (
    <div className="flex items-center">
        <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center 
            ${isAudioActive ? "bg-[#7C3AED]" : "bg-red-500"}`}
        >
            {isAudioActive ? <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
        </div>
        <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ml-1 sm:ml-2 
            ${isVideoActive ? "bg-[#7C3AED]" : "bg-red-500"}`}
        >
            {isVideoActive ? <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
        </div>
        {showControls && <ChevronDown className="w-4 h-4 text-gray-400 ml-1 sm:ml-2 cursor-pointer" onClick={onExpandClick} />}
    </div>
));

const ParticipantActions = memo<{
    participant: StreamVideoParticipant;
    currentUserRole?: string[];
    onTip: (participant: StreamVideoParticipant) => void;
    onUpdateRole: (userId: string, newRole: string) => void;
}>(({ participant, currentUserRole, onTip, onUpdateRole }) => {
    const { canPromote } = useMemo(() => {
        const isCurrentUserHost = currentUserRole?.some((role) => ["host", "cohost"].includes(role)) || false;
        const isTargetPrivileged = participant.roles.some((role) => ["host", "cohost"].includes(role));
        return {
            canPromote: isCurrentUserHost && !isTargetPrivileged,
        };
    }, [currentUserRole, participant.roles]);

    return (
        <div className="flex flex-wrap items-center gap-2 p-2">
            <ActionButton
                icon={<DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />}
                text="Send Tip"
                onClick={() => onTip(participant)}
                variant="primary"
            />

            {canPromote && (
                <ActionButton
                    icon={<UsersRound className="text-[#DDB958] w-3 h-3 sm:w-4 sm:h-4" />}
                    text="Make Co-host"
                    onClick={() => onUpdateRole(participant.userId, "cohost")}
                    variant="secondary"
                />
            )}
        </div>
    );
});


const PendingParticipantsList = memo<{
    participants: StreamVideoParticipant[];
    onJoinRequest: (userId: string, accept: boolean) => void;
}>(({ participants, onJoinRequest }) => (
    <div className="mb-4 sm:mb-6">
        <h3 className="text-[#AFAFAF] text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Pending Requests</h3>
        <div className="space-y-2">
            {participants.map((participant) => (
                <div key={participant.userId} className="flex items-center justify-between bg-[#2C2C2C] p-2.5 sm:p-3 rounded-[10px]">
                    <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                        {formatName(participant.name || participant.userId)}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            className="bg-[#6032F6] hover:bg-[#4C28C4] text-white 
                                text-xs sm:text-sm px-3 py-1.5 rounded-full 
                                transition-colors duration-200"
                            onClick={() => onJoinRequest(participant.userId, true)}
                        >
                            Accept
                        </button>
                        <button
                            className="bg-[#383838] hover:bg-[#424242] text-white 
                                text-xs sm:text-sm px-3 py-1.5 rounded-full 
                                transition-colors duration-200"
                            onClick={() => onJoinRequest(participant.userId, false)}
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const ParticipantItem = memo<{
    participant: StreamVideoParticipant;
    currentUser: OwnUserResponse | undefined;
    isExpanded: boolean;
    onExpand: () => void;
    onTip: (participant: StreamVideoParticipant) => void;
    onUpdateRole: (userId: string, newRole: string) => void;
}>(({ participant, currentUser, isExpanded, onExpand, onTip, onUpdateRole }) => {
    const isCurrentUser = participant.userId === currentUser?.id;

    const { role, currentUserRoles, displayName } = useMemo(() => {
        const role = participant.roles.includes("host")
            ? "host"
            : participant.roles.includes("cohost")
            ? "cohost"
            : participant.roles.includes("user")
            ? "user"
            : "listener";

        const currentUserRoles = !currentUser?.role ? undefined : Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];

        const displayName = formatName(participant.name || participant.userId);

        return {
            role,
            currentUserRoles,
            displayName,
        };
    }, [participant, currentUser?.role]);

    const isAudioActive = participant.publishedTracks.includes(1);
    const isVideoActive = participant.publishedTracks.includes(2);

    return (
        <div className="bg-[#2C2C2C] rounded-[10px] hover:bg-[#3C3C3C] transition-colors duration-200">
            <div className="flex items-center justify-between py-2.5 px-3 sm:px-4">
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-white text-xs sm:text-sm font-medium truncate">{displayName}</span>
                        {isCurrentUser && <span className="text-gray-400 text-[10px] sm:text-xs px-1.5 py-0.5 bg-[#383838] rounded-full">You</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span
                            className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full 
                            ${
                                role === "host"
                                    ? "bg-[#6032F6] text-white"
                                    : role === "cohost"
                                    ? "bg-[#4C28C4] text-white"
                                    : "bg-[#383838] text-gray-400"
                            }`}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                    </div>
                </div>
                <ParticipantControls
                    isAudioActive={isAudioActive}
                    isVideoActive={isVideoActive}
                    onExpandClick={onExpand}
                    showControls={!isCurrentUser}
                />
            </div>
            {isExpanded && !isCurrentUser && (
                <ParticipantActions participant={participant} currentUserRole={currentUserRoles} onTip={onTip} onUpdateRole={onUpdateRole} />
            )}
        </div>
    );
});

// Main Component
const ParticipantsSidebar = memo<ParticipantsSidebarProps>(
    ({ participants, currentUser, openTipModal, updateParticipantRole, handleJoinRequest }) => {
        const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

        const { sortedParticipants, pendingParticipants, activeParticipants, isCurrentUserHost } = useMemo(() => {
            const sorted = [...participants].sort((a, b) => {
                const getRoleWeight = (roles: string[]) => {
                    if (roles.includes("host")) return 3;
                    if (roles.includes("cohost")) return 2;
                    if (roles.includes("user")) return 1;
                    return 0;
                };
                return getRoleWeight(b.roles) - getRoleWeight(a.roles);
            });

            const isCurrentUserHost = currentUser?.role?.includes("host") || currentUser?.role?.includes("cohost") || false;

            return {
                sortedParticipants: sorted,
                pendingParticipants: sorted.filter((p) => p.roles.includes("pending")),
                activeParticipants: sorted.filter((p) => !p.roles.includes("pending")),
                isCurrentUserHost,
            };
        }, [participants, currentUser]);

        return (
            <div className="w-full bg-[#1E1E1E] p-2 sm:p-4 mt-2 sm:mt-4 flex flex-col rounded-[10px]">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="flex items-center">
                        <h2 className="text-white text-base sm:text-lg font-semibold">Participants</h2>
                        <span className="bg-[#7C3AED] text-white text-xs px-2 py-0.5 rounded-full ml-2">{sortedParticipants.length}</span>
                    </div>
                    {!isCurrentUserHost && (
                        <Tooltip content="Request host permissions">
                            <button
                                className="flex items-center space-x-1.5 px-2.5 py-1.5
                                bg-[#383838] hover:bg-[#424242] 
                                transition-colors duration-200 rounded-full
                                text-white text-xs"
                            >
                                <UsersRound className="text-[#DDB958] w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Request Host</span>
                            </button>
                        </Tooltip>
                    )}
                </div>

                {pendingParticipants.length > 0 && <PendingParticipantsList participants={pendingParticipants} onJoinRequest={handleJoinRequest} />}

                <h2 className="text-[#AFAFAF] text-sm sm:text-medium font-semibold mb-2 sm:mb-4 mt-2 sm:mt-4">On the call</h2>

                <div
                    className="flex-grow overflow-y-auto space-y-1 sm:space-y-2 
                               max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-350px)]"
                >
                    {activeParticipants.map((participant) => (
                        <ParticipantItem
                            key={participant.sessionId}
                            participant={participant}
                            currentUser={currentUser}
                            isExpanded={expandedParticipant === participant.userId}
                            onExpand={() => setExpandedParticipant(expandedParticipant === participant.userId ? null : participant.userId)}
                            onTip={openTipModal}
                            onUpdateRole={updateParticipantRole}
                        />
                    ))}
                </div>
            </div>
        );
    }
);

// Add display names for debugging
ParticipantControls.displayName = "ParticipantControls";
ParticipantActions.displayName = "ParticipantActions";
PendingParticipantsList.displayName = "PendingParticipantsList";
ParticipantItem.displayName = "ParticipantItem";
ParticipantsSidebar.displayName = "ParticipantsSidebar";
Tooltip.displayName = "Tooltip";
ActionButton.displayName = "ActionButton";

export default ParticipantsSidebar;
