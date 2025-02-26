'use client';

import type React from 'react';
import { useState, useMemo, memo, useEffect } from 'react';
import {
    ChevronDown,
    Mic,
    MicOff,
    Video,
    VideoOff,
    DollarSign,
    UsersRound,
    X,
    MoreHorizontal,
    Pin,
} from 'lucide-react';
import type {
    StreamVideoParticipant,
    OwnUserResponse,
    MemberResponse,
} from '@stream-io/video-react-sdk';
import { Button } from '@/components/ui/button';
// Remove duplicate Avatar import since it's already imported below
import toast from 'react-hot-toast';
import Farcaster from '@/public/icons/socials/Farcaster';
import Twitter from '@/public/icons/socials/Twitter';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Avatar from '@/components/meeting/participantAvatar'; // Add this import if not already present
import Image from 'next/image';
import {
    useIsMobile,
    useDebounceSpeak,
    useParticipantAvatar,
    truncateUsername,
    useParticipantConsistentAvatar,
} from '../../hooks/useParticipantUtils';

// Types
export interface ParticipantsSidebarProps {
    members: MemberResponse[];
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (member: MemberResponse) => void;
    updateParticipantRole: (userId: string, newRole: string) => void;
    handleJoinRequest: (userId: string, accept: boolean) => void;
    isOpen: boolean;
    onClose: () => void;
}

export interface ParticipantItemProps {
    participant: StreamVideoParticipant;
    member: MemberResponse;
    currentUser: OwnUserResponse | undefined;
    onTip: (member: MemberResponse) => void;
    onUpdateRole: (userId: string, newRole: string) => void;
}

export const formatName = (name: string, maxLength = 15): string => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
};

export const MicHandIcon = () => (
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

export const RequestHostButton = memo(() => (
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

export const Tooltip = memo<{ content: string; children: React.ReactNode }>(
    ({ content, children }) => (
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
    )
);

export const ActionButton = memo<{
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
export const ParticipantControls = memo<{
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

export const ParticipantActions = memo<{
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

export const PendingParticipantsList = memo<{
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

export const SessionNotification = () => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;

    return (
        <div className="mt-auto">
            {/* Gradient Border Wrapper */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#6032F6] to-[#F5A524]">
                {/* Main Content */}
                <div className="relative bg-[#1C1C1C] rounded-2xl p-5">
                    {/* Close Button and Title */}
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl text-white font-medium">Your session is live!</h2>
                        <Button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4">
                        Click the button below to copy the call link
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Copy Invite Link Button */}
                        <button
                            className="bg-[#6032F6] hover:bg-[#4C28C4] text-white px-4 py-2.5 rounded-lg transition-colors text-xs font-medium"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied to clipboard');
                            }}
                        >
                            Copy invite link
                        </button>

                        {/* Social Icons */}
                        <div className="flex gap-3">
                            {/* Farcaster Share Button */}
                            <button
                                aria-label="Share on Farcaster"
                                className="text-gray-400 hover:text-white transition-colors"
                                onClick={() => {
                                    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
                                        `Come and join the pod session! ${window.location.href}`
                                    )}`;
                                    window.open(shareUrl, '_blank');
                                }}
                            >
                                <Farcaster />
                            </button>

                            {/* Twitter Share Button */}
                            <button
                                aria-label="Share on Twitter"
                                className="text-gray-400 hover:text-white transition-colors"
                                onClick={() => {
                                    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                        `Come and join the pod session! ${window.location.href}`
                                    )}`;
                                    window.open(shareUrl, '_blank');
                                }}
                            >
                                <Twitter />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Update ParticipantItem component
const ParticipantItem = memo<ParticipantItemProps>(
    ({ participant, member, currentUser, onTip, onUpdateRole }) => {
        const userId = member.user.id;
        const name = member.user.name ?? '';
        const { avatarUrl, getFallbackAvatar } = useParticipantConsistentAvatar(
            userId,
            name,
            member.user.image ?? ''
        );

        const isCurrentUser = participant.userId === currentUser?.id;

        // Move the role definition before we use it
        const role = useMemo(() => {
            if (participant.roles.includes('host')) {
                return 'host';
            } else if (participant.roles.includes('cohost')) {
                return 'cohost';
            } else if (participant.roles.includes('user')) {
                return 'user';
            } else {
                return 'listener';
            }
        }, [participant.roles]);

        const displayName = formatName(participant.name || participant.userId);
        const isAudioActive = participant.publishedTracks.includes(1);

        return (
            <div className="bg-[#2C2C2C] rounded-lg mb-2">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center min-w-0 flex-1 gap-3">
                        <Image
                            src={avatarUrl || getFallbackAvatar()}
                            width={32}
                            height={32}
                            alt={name || 'User avatar'}
                            className="rounded-full"
                            onError={e => {
                                e.currentTarget.src = getFallbackAvatar();
                            }}
                        />
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-medium truncate">
                                {displayName}
                            </span>
                            <span className="text-[#9B9B9B] text-xs mt-0.5">
                                {role === 'host'
                                    ? 'Session Host'
                                    : role === 'cohost'
                                      ? 'Co-host'
                                      : role === 'user'
                                        ? 'User'
                                        : 'Listener'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center 
                        ${isAudioActive ? 'bg-[#7C3AED]' : 'bg-red-500'}`}
                        >
                            {isAudioActive ? (
                                <Mic className="w-4 h-4 text-white" />
                            ) : (
                                <MicOff className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    disabled={isCurrentUser}
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#9B9B9B] bg-inherit hover:bg-inherit hover:text-white"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="bg-[#2C2C2C] border border-[#383838] rounded-lg p-1"
                                side="left"
                            >
                                <DropdownMenuItem
                                    onClick={() => onTip(member)}
                                    className="flex items-center px-3 py-2 text-sm text-white hover:bg-[#383838] rounded-md cursor-pointer"
                                >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Tip {formatName(participant.name || participant.userId)}...
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center px-3 py-2 text-sm text-white hover:bg-[#383838] rounded-md cursor-pointer">
                                    <Pin className="w-4 h-4 mr-2" />
                                    Pin
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center px-3 py-2 text-sm text-white hover:bg-[#383838] rounded-md cursor-pointer">
                                    <MicOff className="w-4 h-4 mr-2" />
                                    Mute audio
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center px-3 py-2 text-sm text-white hover:bg-[#383838] rounded-md cursor-pointer">
                                    <VideoOff className="w-4 h-4 mr-2" />
                                    Disable video
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        );
    }
);

// Main Component
// Update the ParticipantsSidebar component
const ParticipantsSidebar = memo<ParticipantsSidebarProps>(
    ({
        members,
        participants,
        currentUser,
        openTipModal,
        updateParticipantRole,
        handleJoinRequest,
        isOpen,
        onClose,
    }) => {
        const [searchQuery, setSearchQuery] = useState('');

        const { pendingParticipants, activeParticipants } = useMemo(() => {
            return {
                pendingParticipants: participants.filter(p => p.roles.includes('pending')),
                activeParticipants: participants.filter(p => !p.roles.includes('pending')),
            };
        }, [participants]);

        const filteredActiveParticipants = useMemo(() => {
            if (!searchQuery) return activeParticipants;
            return activeParticipants.filter(participant =>
                (participant.name || participant.userId)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        }, [activeParticipants, searchQuery]);

        return (
            <>
                <div
                    className={`fixed inset-y-0 right-0 z-50 w-[80%] sm:w-[380px] transform transition-transform duration-300 ease-in-out ${
                        isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                    style={{
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        position: 'fixed',
                        top: 0,
                        bottom: '80px', // Add space for footer
                        right: 0,
                    }}
                >
                    {isOpen && (
                        <div
                            className="fixed inset-0 -z-10 bg-black/50 sm:hidden"
                            onClick={onClose}
                        />
                    )}

                    <div className="absolute right-0 h-full w-full bg-[#1C1C1C] p-4 rounded-l-[20px] overflow-hidden flex flex-col shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <button
                                    aria-label="Close participants sidebar"
                                    onClick={onClose}
                                    className="mr-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-white text-lg font-medium">Participants</h2>
                            </div>
                            <span className="text-sm bg-[#6032F6] text-white px-2 py-1 rounded-full">
                                {activeParticipants.length}/50
                            </span>
                        </div>

                        <div className="relative mb-4">
                            <div className="rounded-lg p-[1px] bg-gradient-to-r from-[#6032F6] to-[#F5A524]">
                                <input
                                    type="text"
                                    placeholder="Search for participant"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#2C2C2C] text-white text-sm rounded-lg px-4 py-2.5 
                                    focus:outline-none focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#383838] scrollbar-track-transparent pb-4">
                            <div className="space-y-4">
                                {pendingParticipants.length > 0 && (
                                    <PendingParticipantsList
                                        participants={pendingParticipants}
                                        onJoinRequest={handleJoinRequest}
                                    />
                                )}
                                {filteredActiveParticipants.map(participant => {
                                    const member = members.find(
                                        m => m.user.id === participant.userId
                                    );
                                    if (!member) return null;

                                    return (
                                        <ParticipantItem
                                            key={participant.userId}
                                            participant={participant}
                                            member={member}
                                            currentUser={currentUser}
                                            onTip={openTipModal}
                                            onUpdateRole={updateParticipantRole}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-4 mb-4">
                            {' '}
                            {/* Added bottom margin */}
                            {SessionNotification()}
                        </div>
                    </div>
                </div>
            </>
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
