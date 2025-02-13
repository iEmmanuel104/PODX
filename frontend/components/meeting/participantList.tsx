'use client';

import React, { useState, useMemo, memo } from 'react';
import { ChevronDown, Mic, MicOff, Video, VideoOff, DollarSign, UsersRound } from 'lucide-react';
import { StreamVideoParticipant, OwnUserResponse } from '@stream-io/video-react-sdk';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Types
interface ParticipantsSidebarProps {
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (participant: StreamVideoParticipant) => void;
    updateParticipantRole: (userId: string, newRole: string) => void;
    handleJoinRequest: (userId: string, accept: boolean) => void;
}

const formatName = (name: string, maxLength: number = 15): string => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
};

const MicHandIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#DDB958] w-3 h-3 sm:w-4 sm:h-4"
    >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
        <path d="M19 15.5c.5 1 .5 2-.5 2.5s-2 .5-2.5-.5" />
    </svg>
);

const RequestHostButton = memo(() => (
    <Tooltip content="Request host permissions">
        <Button
            className="flex items-center space-x-1.5 px-2.5 py-1.5
            bg-[#383838] hover:bg-[#424242] 
            transition-colors duration-200 rounded-full
            text-white text-xs"
        >
            <MicHandIcon />
        </Button>
    </Tooltip>
));

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
    variant?: 'primary' | 'secondary';
    className?: string;
}>(({ icon, text, onClick, variant = 'primary', className = '' }) => (
    <Tooltip content={text}>
        <Button
            onClick={onClick}
            className={`flex items-center space-x-1 px-2.5 py-1.5
                ${variant === 'primary' ? 'bg-[#6032F6] hover:bg-[#4C28C4]' : 'bg-[#383838] hover:bg-[#424242]'}
                transition-colors duration-200 rounded-full
                text-white text-xs ${className}`}
        >
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </Button>
    </Tooltip>
));

// Memoized Sub-components
const ParticipantControls = memo<{
    isAudioActive: boolean;
    isVideoActive: boolean;
    onExpandClick: () => void;
    showControls: boolean;
}>(({ isAudioActive, isVideoActive, onExpandClick, showControls }) => (
    <div className="flex items-center">
        <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center 
            ${isAudioActive ? 'bg-[#7C3AED]' : 'bg-red-500'}`}
        >
            {isAudioActive ? (
                <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            ) : (
                <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            )}
        </div>
        <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ml-1 
            ${isVideoActive ? 'bg-[#7C3AED]' : 'bg-red-500'}`}
        >
            {isVideoActive ? (
                <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            ) : (
                <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            )}
        </div>
        {showControls && (
            <ChevronDown
                className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-1 cursor-pointer"
                onClick={onExpandClick}
            />
        )}
    </div>
));

const ParticipantActions = memo<{
    participant: StreamVideoParticipant;
    currentUserRole?: string[];
    onTip: (participant: StreamVideoParticipant) => void;
    onUpdateRole: (userId: string, newRole: string) => void;
}>(({ participant, currentUserRole, onTip, onUpdateRole }) => {
    const { canPromote } = useMemo(() => {
        const isCurrentUserHost =
            currentUserRole?.some(role => ['host', 'cohost'].includes(role)) || false;
        const isTargetPrivileged = participant.roles.some(role =>
            ['host', 'cohost'].includes(role)
        );
        return {
            canPromote: isCurrentUserHost && !isTargetPrivileged,
        };
    }, [currentUserRole, participant.roles]);

    return (
        <div className="flex flex-wrap items-center gap-2 p-2">
            <ActionButton
                icon={<DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />}
                text="Send Tip 1"
                onClick={() => onTip(participant)}
                variant="primary"
            />

            {canPromote && (
                <ActionButton
                    icon={<UsersRound className="text-[#DDB958] w-3 h-3 sm:w-4 sm:h-4" />}
                    text="Make Co-host"
                    onClick={() => onUpdateRole(participant.userId, 'cohost')}
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
        <h3 className="text-[#AFAFAF] text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
            Pending Requests
        </h3>
        <div className="space-y-2">
            {participants.map(participant => (
                <div
                    key={participant.userId}
                    className="flex items-center justify-between bg-[#2C2C2C] p-2.5 sm:p-3 rounded-[10px]"
                >
                    <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                        {formatName(participant.name || participant.userId)}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button
                            className="bg-[#6032F6] hover:bg-[#4C28C4] text-white 
                                text-xs sm:text-sm px-3 py-1.5 rounded-full 
                                transition-colors duration-200"
                            onClick={() => onJoinRequest(participant.userId, true)}
                        >
                            Accept
                        </Button>
                        <Button
                            className="bg-[#383838] hover:bg-[#424242] text-white 
                                text-xs sm:text-sm px-3 py-1.5 rounded-full 
                                transition-colors duration-200"
                            onClick={() => onJoinRequest(participant.userId, false)}
                        >
                            Decline
                        </Button>
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

    const { role, currentUserRoles, displayName } = useMemo(
        () => ({
            role: participant.roles.includes('host')
                ? 'host'
                : participant.roles.includes('cohost')
                    ? 'cohost'
                    : participant.roles.includes('user')
                        ? 'user'
                        : 'listener',
            currentUserRoles: !currentUser?.role
                ? undefined
                : Array.isArray(currentUser.role)
                    ? currentUser.role
                    : [currentUser.role],
            displayName: formatName(participant.name || participant.userId),
        }),
        [participant, currentUser?.role]
    );

    const isAudioActive = participant.publishedTracks.includes(1);
    const isVideoActive = participant.publishedTracks.includes(2);

    const roleStyles = {
        host: 'bg-[#6032F6] text-white',
        cohost: 'bg-[#4C28C4] text-white',
        default: 'bg-[#383838] text-gray-400',
    };

    return (
        <div className="bg-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors duration-200">
            <div className="flex items-center justify-between p-2.5">
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
                            {displayName}
                        </span>
                        {isCurrentUser && (
                            <span className="text-gray-400 text-xs px-1.5 py-0.5 bg-[#383838] rounded-full">
                                You
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${roleStyles[role as keyof typeof roleStyles] || roleStyles.default}`}
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
                <div className="flex flex-wrap items-center gap-2 p-2 border-t border-[#383838]">
                    <Button
                        onClick={() => {
                            console.log("participant to tip", { participant })
                            onTip(participant)
                        }}
                        className="flex items-center justify-center gap-1.5 bg-[#6032F6] hover:bg-[#4C28C4] text-white text-xs px-2 py-1 rounded-full"
                    >
                        <Image
                            src="/images/money-send.svg"
                            alt="Send Tip"
                            width={20}
                            height={20}
                            className="mb-0"
                            priority
                        />
                        <p className="">Send Tip to {participant.name}</p>
                    </Button>

                    {currentUserRoles?.includes('host') && !participant.roles.includes('host') && (
                        <Button
                            onClick={() => onUpdateRole(participant.userId, 'cohost')}
                            className="flex items-center gap-1.5 bg-[#383838] hover:bg-[#424242] text-white text-xs px-3 py-1.5 rounded-full"
                        >
                            <UsersRound className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDB958]" />
                            <span className="hidden sm:inline">Make Co-host</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});

// Main Component
const ParticipantsSidebar = memo<ParticipantsSidebarProps>(
    ({ participants, currentUser, openTipModal, updateParticipantRole, handleJoinRequest }) => {
        const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
        const participoantsObj = JSON.parse(JSON.stringify(participants));
        console.log({participoantsObj});

        const { sortedParticipants, pendingParticipants, activeParticipants, isCurrentUserHost } =
            useMemo(() => {
                const sorted = [...participants].sort((a, b) => {
                    const getRoleWeight = (roles: string[]) => {
                        if (roles.includes('host')) return 3;
                        if (roles.includes('cohost')) return 2;
                        if (roles.includes('user')) return 1;
                        return 0;
                    };
                    return getRoleWeight(b.roles) - getRoleWeight(a.roles);
                });

                const isCurrentUserHost =
                    currentUser?.role?.includes('host') ||
                    currentUser?.role?.includes('cohost') ||
                    false;

                return {
                    sortedParticipants: sorted,
                    pendingParticipants: sorted.filter(p => p.roles.includes('pending')),
                    activeParticipants: sorted.filter(p => !p.roles.includes('pending')),
                    isCurrentUserHost,
                };
            }, [participants, currentUser]);

        return (
            <div className="flex flex-col h-full bg-[#1F1F1F]">
                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {pendingParticipants.length > 0 && (
                        <PendingParticipantsList
                            participants={pendingParticipants}
                            onJoinRequest={handleJoinRequest}
                        />
                    )}
                    {sortedParticipants.map(participant => (
                        <ParticipantItem
                            key={participant.userId}
                            participant={participant}
                            currentUser={currentUser}
                            isExpanded={expandedParticipant === participant.userId}
                            onExpand={() =>
                                setExpandedParticipant(prev =>
                                    prev === participant.userId ? null : participant.userId
                                )
                            }
                            onTip={openTipModal}
                            onUpdateRole={updateParticipantRole}
                        />
                    ))}
                </div>

                {/* Fixed Bottom Section */}
                <div className="sticky bottom-0 bg-[#2C2C2C] p-4">
                    <h1>Your session is live!</h1>
                    <p className="mb-4 text-gray-400">
                        Click the button below to copy the call link
                    </p>
                    <Button
                        className="w-full bg-[#6032F6] hover:bg-[#4C28C4] text-white px-4 py-2 rounded-lg"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast.success('Link copied to clipboard');
                        }}
                    >
                        Copy Link
                    </Button>
                </div>
            </div>
        );
    }
);

// Add display names for debugging
ParticipantControls.displayName = 'ParticipantControls';
ParticipantActions.displayName = 'ParticipantActions';
PendingParticipantsList.displayName = 'PendingParticipantsList';
ParticipantItem.displayName = 'ParticipantItem';
ParticipantsSidebar.displayName = 'ParticipantsSidebar';
Tooltip.displayName = 'Tooltip';
ActionButton.displayName = 'ActionButton';
RequestHostButton.displayName = 'RequestHostButton';

export default ParticipantsSidebar;
