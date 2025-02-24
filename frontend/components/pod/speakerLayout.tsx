import React, { useEffect, useState, useMemo } from 'react';
import {
    combineComparators,
    hasScreenShare,
    ParticipantView,
    pinned,
    screenSharing,
    StreamVideoParticipant,
    useCall,
    useCallStateHooks,
    isPinned,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { Mic, MicOff, MoreHorizontal } from "lucide-react";
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

// ============= Utility Hooks =============
const useDebounceSpeak = (isSpeaking: boolean, delay: number = 550) => {
    const [debouncedSpeaking, setDebouncedSpeaking] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isSpeaking) {
            setDebouncedSpeaking(true);
        } else {
            timeoutId = setTimeout(() => setDebouncedSpeaking(false), delay);
        }
        return () => timeoutId && clearTimeout(timeoutId);
    }, [isSpeaking, delay]);

    return debouncedSpeaking;
};

const useParticipantAvatar = (userId: string) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!userId.startsWith('0x')) return;
            try {
                const basename = await getBasename(userId as `0x${string}`);
                if (basename) {
                    const avatar = await getBasenameAvatar(basename);
                    setAvatarUrl(avatar);
                }
            } catch (error) {
                console.error('Error fetching avatar:', error);
            }
        };
        fetchAvatar();
    }, [userId]);

    return avatarUrl;
};

// ============= Utility Functions =============
const truncateNameTo6Chars = (name: string) => {
    if (name.startsWith('guest-')) {
        const username = name.slice(6);
        return `guest-${username.slice(0, 6)}${username.length > 6 ? '...' : ''}`;
    }
    return name.length > 6 ? `${name.slice(0, 6)}...` : name;
};

// ============= Component Interfaces =============
interface ParticipantTileProps {
    participant: StreamVideoParticipant;
    totalParticipants: number;
    index: number;
    style?: React.CSSProperties;
}

interface MinimalParticipantUIProps {
    children: React.ReactNode;
    participant: StreamVideoParticipant;
}

// ============= UI Components =============
const ParticipantTile = React.memo(({ participant, index, style }: ParticipantTileProps) => {
    const isAudioEnabled = participant.publishedTracks.includes(1);
    const isSpeaking = participant.isSpeaking;
    const debouncedSpeaking = useDebounceSpeak(isSpeaking);
    const basenameAvatar = useParticipantAvatar(participant.userId);
    const isMobile = window.innerWidth < 640;
    const displayName = useMemo(() => 
        truncateNameTo6Chars(participant.name || participant.userId),
        [participant.name, participant.userId]
    );
    
    const shouldShowAllElements = !isMobile || index === 0;
    const shouldShowMinimalElements = isMobile && index === 1;

    return (
        <div 
            className={clsx(
                "relative w-full h-full flex",
                "items-center justify-center",
                "bg-[#2A2A2A] rounded-xl overflow-hidden"
            )}
            style={style}
        >
            {(shouldShowAllElements || shouldShowMinimalElements) && (
                <>
                    <div className={clsx(
                        "absolute left-[14px] top-[13px] z-10",
                        "flex items-center",
                        "p-[6px]",
                        "bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]"
                    )}>
                        <div
                            style={{
                                background: !isAudioEnabled ? "#FF3B30" : debouncedSpeaking ? "#5E5CE6" : "#808080",
                                borderRadius: "50%",
                                padding: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {!isAudioEnabled ? <MicOff className="h-3 w-3 text-white" /> : <Mic className="h-3 w-3 text-white" />}
                        </div>
                    </div>
                    <button
                        aria-label="More options"
                        className={clsx(
                            "absolute right-[14px] top-[13px] z-10",
                            "bg-transparent border-none",
                            "cursor-pointer",
                            "p-1"
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5 text-white/80" />
                    </button>
                </>
            )}

            {shouldShowAllElements && (
                <>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {basenameAvatar ? (
                            <img
                                src={basenameAvatar}
                                alt={displayName}
                                className="w-[38.4px] h-[38.4px] rounded-full object-cover"
                            />
                        ) : (
                            <div className={clsx(
                                "w-[38.4px] h-[38.4px]",
                                "flex items-center justify-center",
                                "rounded-full bg-[#4B4B4B]"
                            )}>
                                <svg
                                    width="25.6"
                                    height="25.6"
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
                    <div className={clsx(
                        "absolute left-[14px] bottom-[13px]",
                        "flex items-center",
                        "p-[6px] gap-2",
                        "bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]"
                    )}>
                        <span className="text-white text-sm px-1.5">{displayName}</span>
                    </div>
                </>
            )}
        </div>
    );
});
ParticipantTile.displayName = 'ParticipantTile';

const ScreenShareUI = React.memo(({ children }: { children: React.ReactNode }) => (
    <div className="w-full h-full">{children}</div>
));
ScreenShareUI.displayName = 'ScreenShareUI';

const OverflowIndicator = ({ count }: { count: number }) => (
    <div className={clsx(
        "flex items-center",
        "p-[6px_12px] gap-2",
        "bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]"
    )}>
        <div className="flex items-center bg-transparent p-0.5">
            {[...Array(3)].map((_, index) => (
                <div
                    key={index}
                    className={clsx(
                        "w-6 h-6 flex items-center justify-center",
                        "-ml-1.5 first:ml-0",
                        "rounded-full bg-[#2A2A2A] border border-[#1D1D1D]"
                    )}
                    style={{ zIndex: 3 - index }}
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
                        className="text-[#808080]"
                    >
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            ))}
        </div>
        <span className="text-white text-sm">+{count}</span>
    </div>
);

const SpeakerLayout = () => {
    const call = useCall();
    const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const { ref } = useAnimateVideoLayout(true);
    const participants = useParticipants();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const [participantsBar, setParticipantsBar] = useState<HTMLDivElement | null>(null);

    // Find participants by status using helper functions
    const screenSharingParticipant = useMemo(
        () => participants.find(p => hasScreenShare(p)),
        [participants]
    );

    const pinnedParticipant = useMemo(() => participants.find(p => isPinned(p)), [participants]);

    // Determine spotlight participant and others
    const [participantInSpotlight, ...otherParticipants] = useMemo(() => {
        const sortedParticipants = [...participants].sort((a, b) => {
            if (hasScreenShare(a)) return -1;
            if (hasScreenShare(b)) return 1;
            if (isPinned(a)) return -1;
            if (isPinned(b)) return 1;
            return 0;
        });
        
        return sortedParticipants;
    }, [participants]);

    useEffect(() => {
        if (!call) return;
        const customSortingPreset = combineComparators(screenSharing, pinned);
        call.setSortParticipantsBy(customSortingPreset);
    }, [call]);

    useEffect(() => {
        if (!participantsBar || !call) return;
        const cleanup = call.dynascaleManager.setViewport(participantsBar);
        return () => cleanup();
    }, [participantsBar, call]);

    // Add cleanup effect
    useEffect(() => {
        if (!hasOngoingScreenShare && call) {
            // When screen sharing ends, unpin any pinned participants
            participants.forEach(participant => {
                if (isPinned(participant) && !hasScreenShare(participant)) {
                    call.unpin(participant.sessionId);
                }
            });
        }
    }, [hasOngoingScreenShare, call, participants]);

    // First, let's properly type the MinimalParticipantUI component
    interface MinimalParticipantUIProps {
        children: React.ReactNode;
        participant: StreamVideoParticipant;
    }

    const MinimalParticipantUI = ({ children }: MinimalParticipantUIProps) => {
        return (
            <div className="str-video__participant-view w-full h-full">
                {children}
            </div>
        );
    };

    // Then update the screen sharing section:
    if (hasOngoingScreenShare && screenSharingParticipant) {
        return (
            <div ref={ref} className="w-full h-full relative overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Main content area with screen share */}
                    <div className="flex-1 min-h-0 w-full p-2 md:p-4">
                        <div className="w-full h-full">
                            <div className="w-full h-full relative">
                                <div className="absolute inset-0">
                            <ParticipantView
                                participant={screenSharingParticipant}
                                trackType="screenShareTrack"
                                        ParticipantViewUI={ScreenShareUI}
                                VideoPlaceholder={VideoPlaceholder}
                            />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Participants bar */}
                    {otherParticipants.length > 0 && (
                        <div className="h-32 sm:h-36 flex-shrink-0">
                            <div
                                ref={setParticipantsBar}
                                className="flex gap-4 h-full overflow-x-auto justify-center px-2 relative"
                            >
                                {/* Show only first 2 participants */}
                                <div className="flex gap-4">
                                    {otherParticipants.slice(0, 2).map((participant, index) => (
                                    <div
                                        key={participant.sessionId}
                                            className="h-full aspect-[4/3] flex-shrink-0 bg-[#2A2A2A] rounded-xl overflow-hidden"
                                    >
                                            <ParticipantTile
                                            participant={participant}
                                                totalParticipants={2}  // Force to show only 2
                                                index={index}
                                        />
                                    </div>
                                ))}
                                </div>

                                {/* Show overflow indicator when more than 2 participants */}
                                {otherParticipants.length > 2 && (
                                    <div className="absolute right-4 bottom-4 z-10">
                                        <OverflowIndicator count={otherParticipants.length - 2} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Regular layout for 2-4 participants
    if (participants.length <= 4) {
        return (
            <div ref={ref} className="w-full h-full p-2 md:p-4">
                <div
                    className={clsx(
                        'grid w-full h-full gap-2 md:gap-4 max-w-7xl mx-auto',
                        participants.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'
                    )}
                >
                    {participants.map(participant => (
                        <div
                            key={participant.sessionId}
                            className={clsx(
                                'relative rounded-xl overflow-hidden transition-transform duration-300',
                                'flex items-center justify-center',
                                isPinned(participant) && 'scale-100 hover:scale-[1.02]'
                            )}
                        >
                            <ParticipantView
                                participant={participant}
                                ParticipantViewUI={ParticipantViewUI}
                                VideoPlaceholder={VideoPlaceholder}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Single participant view
    if (participants.length === 1) {
        return (
            <div ref={ref} className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full h-full max-w-4xl mx-auto rounded-xl overflow-hidden">
                    <ParticipantView
                        participant={participants[0]}
                        ParticipantViewUI={ParticipantViewUI}
                        VideoPlaceholder={VideoPlaceholder}
                    />
                </div>
            </div>
        );
    }

    // Multi-participant layout
    return (
        <div ref={ref} className="w-full h-full relative overflow-hidden">
            <div className="h-full p-2 md:p-4 flex flex-col">
                {/* Spotlight participant */}
                <div className="flex-grow min-h-0 mb-2 md:mb-4">
                    <div className="w-full h-full max-w-6xl mx-auto rounded-xl overflow-hidden">
                        <ParticipantView
                            participant={{
                                ...participantInSpotlight,
                                name: truncateNameTo6Chars(participantInSpotlight.name || participantInSpotlight.userId)
                            }}
                            trackType={
                                hasScreenShare(participantInSpotlight)
                                    ? 'screenShareTrack'
                                    : 'videoTrack'
                            }
                            ParticipantViewUI={ParticipantViewUI}
                            VideoPlaceholder={VideoPlaceholder}
                        />
                    </div>
                </div>

                {/* Other participants */}
                {otherParticipants.length > 0 && (
                    <div className="h-32 sm:h-36 flex-shrink-0">
                        <div
                            ref={setParticipantsBar}
                            className="flex gap-4 h-full overflow-x-auto justify-center px-2 relative"
                        >
                            {/* Show only first 2 participants */}
                            <div className="flex gap-4">
                                {otherParticipants.slice(0, 2).map((participant, index) => (
                                <div
                                    key={participant.sessionId}
                                        className="h-full aspect-[4/3] flex-shrink-0 bg-[#2A2A2A] rounded-xl overflow-hidden"
                                >
                                        <ParticipantTile
                                        participant={participant}
                                            totalParticipants={2}  // Force to show only 2
                                            index={index}
                                    />
                                </div>
                            ))}
                            </div>

                            {/* Show overflow indicator when more than 2 participants */}
                            {otherParticipants.length > 2 && (
                                <div className="absolute right-4 bottom-4 z-10">
                                    <OverflowIndicator count={otherParticipants.length - 2} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpeakerLayout;
