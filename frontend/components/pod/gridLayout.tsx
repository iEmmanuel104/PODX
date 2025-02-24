// GridLayout.tsx
import { useMemo, useEffect, useState } from 'react';
import {
    combineComparators,
    ParticipantView,
    StreamVideoParticipant,
    useCall,
    useCallStateHooks,
    hasScreenShare,
    role,
    speaking,
    publishingVideo,
    publishingAudio,
    isPinned,
} from '@stream-io/video-react-sdk';
import { Mic, MicOff, MoreHorizontal, ScreenShareOff } from "lucide-react"
import clsx from 'clsx';
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';
import Image from 'next/image';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';
import { 
    useIsMobile, 
    useDebounceSpeak, 
    useParticipantAvatar,
    truncateUsername 
} from '../../hooks/useParticipantUtils';

// Add ParticipantTile component
interface ParticipantTileProps {
    name: string;
    isMuted?: boolean;
    isSpeaking?: boolean;
    avatarUrl?: string;
    style?: React.CSSProperties;
    isScreenSharing?: boolean;
    onStopScreenShare?: () => void;
}

// Update ParticipantTile component
const ParticipantTile = ({
    name,
    isMuted,
    isSpeaking,
    style,
    userId,
    totalParticipants,
    index,
    isScreenSharing,
    onStopScreenShare
}: ParticipantTileProps & {
    userId: string;
    totalParticipants: number;
    index: number;
    isScreenSharing?: boolean;
    onStopScreenShare?: () => void;
}) => {
    const isActuallySpeaking = useDebounceSpeak(isSpeaking || false);
    const isMobile = useIsMobile();
    const [displayName, setDisplayName] = useState(name);
    const basenameAvatar = useParticipantAvatar(userId);
    
    useEffect(() => {
        const updateDisplayName = async () => {
            const truncated = await truncateUsername(name, userId, isMobile);
            setDisplayName(truncated);
        };

        updateDisplayName();
    }, [name, userId, isMobile]);

    // Show name if:
    // 1. On desktop OR
    // 2. On mobile AND:
    //    - Total participants <= 4 OR
    //    - This is one of the first 3 tiles when there are more than 4 participants
    const shouldShowName = !isMobile || (totalParticipants <= 4 || index < 3);

    return (
        <div style={style}>
            {/* Status indicator */}
            <div
                style={{
                    position: "absolute",
                    left: "14px",
                    top: "13px",
                    display: "flex",
                    alignItems: "center",
                    padding: "6px",
                    gap: "8px",
                    background: "rgba(75, 75, 75, 0.5)",
                    backdropFilter: "blur(5.7px)",
                    borderRadius: "1000px",
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        background: isMuted ? "#FF3B30" : isActuallySpeaking ? "#5E5CE6" : "#808080",
                        borderRadius: "50%",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {isMuted ? (
                        <MicOff className="h-3 w-3 text-white" />
                    ) : (
                        <Mic className="h-3 w-3 text-white" />
                    )}
                </div>
                {/* Only show text on desktop */}
                {!isMobile && (
                    <span style={{ color: "white", fontSize: "14px", paddingRight: "6px" }}>
                        {isMuted ? "Muted" : isActuallySpeaking ? "Speaking..." : "Not Speaking"}
                    </span>
                )}
            </div>

            {/* Stop Screen Share Button - Only show when screen sharing */}
            {isScreenSharing && onStopScreenShare && (
                <button
                    onClick={onStopScreenShare}
                    className="absolute right-[14px] top-[13px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-full p-2 cursor-pointer z-20 hover:bg-[rgba(95,95,95,0.5)] transition-colors"
                    aria-label="Stop screen sharing"
                >
                    <ScreenShareOff className="h-5 w-5 text-white" />
                </button>
            )}

            {/* More Options - Only show when not screen sharing */}
            {!isScreenSharing && (
                <button
                    aria-label="More options"
                    style={{
                        position: "absolute",
                        right: "14px",
                        top: "13px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        zIndex: 10,
                    }}
                >
                    <MoreHorizontal className="h-5 w-5 text-white/80" />
                </button>
            )}

            {/* Avatar */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {basenameAvatar ? (
                    <Image
                        src={basenameAvatar}
                        width={48}
                        height={48}
                        alt="Participant avatar"
                        className="rounded-full"
                        priority
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-[#4B4B4B] flex items-center justify-center">
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#808080]"
                        >
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Name Label - Only show when appropriate */}
            {shouldShowName && (
                <div
                    style={{
                        position: "absolute",
                        left: "14px",
                        bottom: "13px",
                        display: "flex",
                        alignItems: "center",
                        padding: "6px",
                        gap: "8px",
                        background: "rgba(75, 75, 75, 0.5)",
                        backdropFilter: "blur(5.7px)",
                        borderRadius: "1000px",
                    }}
                >
                    <span style={{ color: "white", fontSize: "14px" }}>{displayName}</span>
                </div>
            )}
        </div>
    );
};

// Update the OverflowIndicator component
const OverflowIndicator = ({ count, style }: { count: number, style: React.CSSProperties }) => {
    return (
        <div 
            style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                gap: "8px",
                background: "rgba(75, 75, 75, 0.5)",
                backdropFilter: "blur(5.7px)",
                borderRadius: "1000px",
                ...style
            }}
        >
            {/* Container for overlapping avatars - without blur */}
            <div 
                style={{
                    display: "flex",
                    alignItems: "center",
                    background: "transparent",
                    padding: "2px"
                }}
            >
                {[...Array(3)].map((_, index) => (
                    <div
                        key={index}
                        style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#2A2A2A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: index > 0 ? '-6px' : '0',
                            zIndex: 3 - index,
                            border: "1px solid #1D1D1D"
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: "#808080" }}
                        >
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                ))}
            </div>
            {/* Overflow Count */}
            <span className="text-white text-sm">
                +{count}
            </span>
        </div>
    );
};

const GridLayout = () => {
    const call = useCall();
    const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const participants = useParticipants();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const { ref } = useAnimateVideoLayout(false);

    // Add effect to handle screen share cleanup
    useEffect(() => {
        if (!hasOngoingScreenShare && call) {
            // Find any pinned participants
            const pinnedParticipant = participants.find(p => isPinned(p));
            if (pinnedParticipant && !hasScreenShare(pinnedParticipant)) {
                // Unpin if they're not screen sharing
                call.unpin(pinnedParticipant.sessionId);
            }
        }
    }, [hasOngoingScreenShare, call, participants]);

    const participantComparator = useMemo(() => {
        return combineComparators(
            role('host', 'cohost', 'user', 'listener'),
            speaking,
            publishingVideo,
            publishingAudio
        );
    }, []);

    // Update the participant sorting logic
    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            // Speaking participants first
            if (a.isSpeaking && !b.isSpeaking) return -1;
            if (!a.isSpeaking && b.isSpeaking) return 1;

            // Then screen sharing
            if (hasScreenShare(a)) return -1;
            if (hasScreenShare(b)) return 1;

            // Then pinned
            if (isPinned(a)) return -1;
            if (isPinned(b)) return 1;

            // Then basename users
            const aHasBasename = a.userId.startsWith('0x');
            const bHasBasename = b.userId.startsWith('0x');
            if (aHasBasename && !bHasBasename) return -1;
            if (!aHasBasename && bHasBasename) return 1;

            return 0;
        });
    }, [participants]);

    // Split participants into visible and overflow
    const [visibleParticipants, overflowParticipants] = useMemo(() => {
        // Always show speaking participants
        const speaking = sortedParticipants.filter(p => p.isSpeaking);
        const nonSpeaking = sortedParticipants.filter(p => !p.isSpeaking);

        // Fill remaining slots with non-speaking participants
        const visible = [...speaking];
        if (visible.length < 4) {
            visible.push(...nonSpeaking.slice(0, 4 - visible.length));
        }

        // Rest go to overflow
        const overflow = sortedParticipants.filter(p => !visible.includes(p));

        return [visible, overflow];
    }, [sortedParticipants]);

    // Get grid container styles based on participant count
    const getGridContainerStyles = (count: number) => {
        switch (count) {
            case 1:
                return {
                    display: "grid",
                    width: "1231px",
                    height: "806px",
                    gridTemplateColumns: "1fr",
                };
            case 2:
                return {
                    display: "grid",
                    width: "600px",
                    height: "782px",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "17px",
                };
            case 3:
                return {
                    display: "grid",
                    width: "917px",
                    height: "587px",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gridTemplateRows: "auto auto",
                    gap: "17px",
                };
            case 4:
                return {
                    display: "grid",
                    width: "917px",
                    height: "587px",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "17px",
                };
            default:
                return {
                    display: "grid",
                    width: "1231px",
                    height: "782px",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridTemplateRows: "285px auto",
                    gap: "17px",
                };
        }
    };

    // Get tile styles based on participant count and position
    const getTileStyles = (index: number, count: number) => {
        const isSmallTile = count > 4 && index >= 4;

        const baseStyles = {
            boxSizing: "border-box" as const,
            position: "relative" as const,
            background: "#2A2A2A",
            borderRadius: "20px",
            padding: "13px 14px"
        };

        if (count === 1) {
            return {
                ...baseStyles,
                width: "1231px",
                height: "806px",
            };
        }

        if (count === 2) {
            return {
                ...baseStyles,
                width: "291.5px",
                height: "782px",
            };
        }

        if (count === 3 && index === 2) {
            return {
                ...baseStyles,
                width: "450px",
                height: "285px",
                gridColumn: "span 2",
                justifySelf: "center",
            };
        }

        if (isSmallTile) {
            return {
                ...baseStyles,
                width: "288.25px",
                height: "162px",
            };
        }

        return {
            ...baseStyles,
            width: count > 4 ? "600.5px" : "450px",
            height: "285px",
        };
    };

    // Add handler for stopping screen share
    const handleStopScreenShare = async (participant: StreamVideoParticipant) => {
        if (!call) return;
        
        try {
            // Use the screenShare object's toggle method
            if (call.screenShare) {
                await call.screenShare.toggle();
            }
            // Unpin the participant
            call.unpin(participant.sessionId);
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    };

    return (
        <div ref={ref} className="w-full relative overflow-hidden flex items-center justify-center">
            <div 
                className={clsx(
                    "flex flex-col items-start w-full bg-[#1D1D1D] rounded-[20px] relative",
                    // Base styles for both mobile and desktop
                    "p-2 sm:p-3",
                    "gap-4 sm:gap-6",
                    // Desktop specific
                    "sm:max-w-[1249px]",
                    // Mobile specific - maintain aspect ratio and spacing
                    "mx-4",
                    // Adjust height to account for footer, header, and margins
                    "h-[calc(100vh-270px)]", // Mobile height
                    "sm:h-[calc(100vh-250px)]", // Increased space for desktop footer
                    // Different margins for mobile and desktop
                    "mt-[50px] mb-[100px]", // Mobile margins
                    "sm:mt-[42px] sm:mb-[120px]" // Much larger bottom margin for desktop
                )}
            >
                <div className={clsx(
                    'grid w-full h-full',
                    'gap-2 sm:gap-6',
                    // Always use 2x2 grid when there are 4 or more participants
                    visibleParticipants.length === 1 && 'grid-cols-1',
                    visibleParticipants.length === 2 && 'grid-cols-2',
                    visibleParticipants.length === 3 && 'grid-cols-2 grid-rows-2',
                    visibleParticipants.length >= 4 && 'grid-cols-2 grid-rows-2'
                )}>
                    {/* Show only first 4 participants */}
                    {visibleParticipants.slice(0, 4).map((participant, index) => {
                        const isAudioEnabled = participant.publishedTracks.includes(1);
                        const isSpeaking = participant.isSpeaking;
                        const isScreenSharing = hasScreenShare(participant);
                        
                        return (
                            <ParticipantTile
                                key={participant.sessionId}
                                name={participant.name || participant.userId}
                                userId={participant.userId}
                                isMuted={!isAudioEnabled}
                                isSpeaking={isSpeaking}
                                totalParticipants={visibleParticipants.length}
                                index={index}
                                isScreenSharing={isScreenSharing}
                                onStopScreenShare={isScreenSharing ? () => handleStopScreenShare(participant) : undefined}
                                style={{
                                    ...getTileStyles(index, Math.min(4, visibleParticipants.length)),
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        );
                    })}

                    {/* Show overflow indicator if more than 4 participants */}
                    {visibleParticipants.length > 4 && (
                        <div className="absolute bottom-4 right-4">
                            <OverflowIndicator 
                                count={visibleParticipants.length - 4} 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GridLayout;
