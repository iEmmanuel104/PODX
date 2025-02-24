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
import { Mic, MicOff, MoreHorizontal } from "lucide-react"
import clsx from 'clsx';
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

// Add ParticipantTile component
interface ParticipantTileProps {
    name: string;
    isMuted?: boolean;
    isSpeaking?: boolean;
    avatarUrl?: string;
    style?: React.CSSProperties;
}

// Add a custom hook for debounced speaking state
const useDebounceSpeak = (isSpeaking: boolean, delay: number = 550) => {
    const [debouncedSpeaking, setDebouncedSpeaking] = useState(false);

    useEffect(() => {
        if (isSpeaking) {
            // If speaking, update immediately
            setDebouncedSpeaking(true);
            return;
        }

        // If not speaking, wait before updating
        const timer = setTimeout(() => {
            setDebouncedSpeaking(false);
        }, delay);

        return () => clearTimeout(timer);
    }, [isSpeaking, delay]);

    return debouncedSpeaking;
};

// Add hook to fetch basename and avatar
const useParticipantAvatar = (userId: string) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (userId.startsWith('0x')) {
                try {
                    const basename = await getBasename(userId as `0x${string}`);
                    if (basename) {
                        const avatar = await getBasenameAvatar(basename);
                        setAvatarUrl(avatar);
                    }
                } catch (error) {
                    console.error('Error fetching avatar:', error);
                }
            }
        };

        fetchAvatar();
    }, [userId]);

    return avatarUrl;
};

// Add useIsMobile hook at the top
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640); // 640px is Tailwind's 'sm' breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// Update truncateUsername to consider screen size
const truncateUsername = (name: string, isMobile: boolean) => {
    if (!isMobile) return name;
    
    if (name.startsWith('guest-')) {
        // Remove 'guest-' prefix and then take first 9 chars
        const username = name.slice(6);
        return `guest-${username.slice(0, 9)}...`;
    }
    // For non-guest names, just take first 9 chars
    return name.length > 9 ? `${name.slice(0, 9)}...` : name;
};

// Update ParticipantTile component
const ParticipantTile = ({ 
    name, 
    isMuted, 
    isSpeaking, 
    style, 
    userId,
    totalParticipants,
    index
}: ParticipantTileProps & { 
    userId: string;
    totalParticipants: number;
    index: number;
}) => {
    const isActuallySpeaking = useDebounceSpeak(isSpeaking);
    const basenameAvatar = useParticipantAvatar(userId);
    const isMobile = useIsMobile();
    const displayName = truncateUsername(name, isMobile);
    
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
                        justifyContent: "center",
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

            {/* More Options */}
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

            {/* Avatar */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            >
                {basenameAvatar ? (
                    <img
                        src={basenameAvatar}
                        alt={name}
                        style={{
                            width: "96px",
                            height: "96px",
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "96px",
                            height: "96px",
                            borderRadius: "50%",
                            background: "#4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            width="64"
                            height="64"
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

    const sortedParticipants = useMemo(() => {
        return [...participants].sort(participantComparator);
    }, [participants, participantComparator]);

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
            padding: "13px 14px",
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
                    sortedParticipants.length === 1 && 'grid-cols-1',
                    sortedParticipants.length === 2 && 'grid-cols-2',
                    sortedParticipants.length === 3 && 'grid-cols-2 grid-rows-2',
                    sortedParticipants.length >= 4 && 'grid-cols-2 grid-rows-2'
                )}>
                    {/* Show only first 4 participants */}
                    {sortedParticipants.slice(0, 4).map((participant, index) => {
                        const isAudioEnabled = participant.publishedTracks.includes(1);
                        const isSpeaking = participant.isSpeaking;
                        
                        return (
                            <ParticipantTile
                                key={participant.sessionId}
                                name={participant.name || participant.userId}
                                userId={participant.userId}
                                isMuted={!isAudioEnabled}
                                isSpeaking={isSpeaking}
                                totalParticipants={sortedParticipants.length}
                                index={index}
                                style={{
                                    ...getTileStyles(index, Math.min(4, sortedParticipants.length)),
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        );
                    })}

                    {/* Show overflow indicator if more than 4 participants */}
                    {sortedParticipants.length > 4 && (
                        <div className="absolute bottom-4 right-4">
                            <OverflowIndicator 
                                count={sortedParticipants.length - 4} 
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
