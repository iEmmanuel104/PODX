import React, { useMemo, useEffect, useState, memo } from 'react';
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
    Audio,
} from '@stream-io/video-react-sdk';
import { Mic, MicOff, MoreHorizontal, ScreenShareOff } from 'lucide-react';
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
    truncateUsername,
    useParticipantConsistentAvatar,
} from '../../hooks/useParticipantUtils';
import { useApplaud } from '../../hooks/useApplaud';
import { ParticipantMenuDropdown } from './participantMenuDropdown';

// In ParticipantTile component
// Add after imports, before ParticipantTile component
interface ParticipantTileProps {
    name: string;
    isMuted: boolean;
    isSpeaking: boolean;
    style: React.CSSProperties;
    userId: string;
    totalParticipants: number;
    index: number;
    participant: StreamVideoParticipant;
    isScreenSharing?: boolean;
    onStopScreenShare?: () => void;
}

const ParticipantTile = memo((
    {
        name,
        isMuted,
        isSpeaking,
        style,
        userId,
        totalParticipants,
        index,
        participant,
        isScreenSharing,
        onStopScreenShare,
    }: ParticipantTileProps) => {
        const isActuallySpeaking = useDebounceSpeak(isSpeaking || false);
        const isMobile = useIsMobile();
        const [displayName, setDisplayName] = useState(name);
        const { isApplauding, handleApplaud } = useApplaud(participant.sessionId);
        const { avatarUrl, getFallbackAvatar } = useParticipantConsistentAvatar(
            userId,
            name,
            participant.image
        );

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
        const shouldShowName = !isMobile || totalParticipants <= 4 || index < 3;

        // Custom video placeholder that shows the avatar
        const VideoPlaceholder = () => (
            <div className="flex items-center justify-center w-full h-full bg-[#2A2A2A]">
                <Image
                    src={avatarUrl || getFallbackAvatar()}
                    width={80}
                    height={80}
                    alt="Participant avatar"
                    className="rounded-full"
                    priority
                    onError={e => {
                        e.currentTarget.src = getFallbackAvatar();
                    }}
                />
            </div>
        );

        // Remove the applaud button and related code from CustomParticipantUI
        const CustomParticipantUI = () => {
            return (
                <>
                    {/* Status indicator */}
                    <div className="absolute left-[14px] top-[13px] flex items-center p-[6px] gap-2 bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px] z-10">
                        <div className={clsx(
                            "rounded-full p-[6px] flex items-center justify-center",
                            isApplauding ? "bg-[#FFD700]" : // Gold color for applauding
                            isMuted ? "bg-[#FF3B30]" : 
                            isActuallySpeaking ? "bg-[#5E5CE6]" : 
                            "bg-[#808080]"
                        )}>
                            {isApplauding ? (
                                <span role="img" aria-label="applaud" className="text-lg">👏</span>
                            ) : isMuted ? (
                                <MicOff className="h-3 w-3 text-white" />
                            ) : (
                                <Mic className="h-3 w-3 text-white" />
                            )}
                        </div>
                        {!isMobile && (
                            <span className="text-white text-sm pr-[6px]">
                                {isApplauding ? "Applauding" : 
                                 isMuted ? "Muted" : 
                                 isActuallySpeaking ? "Speaking..." : 
                                 "Not Speaking"}
                            </span>
                        )}
                    </div>
        
                    {/* Control buttons */}
                    {isScreenSharing ? (
                        <button
                            onClick={onStopScreenShare}
                            aria-label="Stop screen sharing"
                            className="absolute right-[14px] top-[13px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-full p-2 cursor-pointer z-20 hover:bg-[rgba(95,95,95,0.5)] transition-colors"
                        >
                            <ScreenShareOff className="h-5 w-5 text-white" />
                        </button>
                    ) : (
                        <ParticipantMenuDropdown
                            participant={participant}
                            trigger={
                                <button 
                                    className="absolute right-[14px] top-[13px] bg-transparent border-none cursor-pointer p-1 z-10"
                                    aria-label="More options"
                                >
                                    <MoreHorizontal className="h-5 w-5 text-white/80" />
                                </button>
                            }
                        />
                    )}
        
                    {/* Name Label */}
                    {shouldShowName && (
                        <div className="absolute left-[14px] bottom-[13px] flex items-center p-[6px] gap-2 bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]">
                            <span className="text-white text-sm px-1.5">{displayName}</span>
                        </div>
                    )}
                </>
            );
        };

        return (
            <div style={style} className="relative overflow-hidden">
                <Audio participant={participant} trackType="audioTrack" />
                <ParticipantView
                    participant={participant}
                    ParticipantViewUI={CustomParticipantUI}
                    VideoPlaceholder={VideoPlaceholder}
                    className="w-full h-full"
                    trackType={isScreenSharing ? 'screenShareTrack' : 'videoTrack'}
                />
            </div>
        );
    }
);

ParticipantTile.displayName = 'ParticipantTile';

const OverflowParticipantAvatar = memo(({ participant }: { participant: StreamVideoParticipant }) => {
    const { avatarUrl, getFallbackAvatar } = useParticipantConsistentAvatar(
        participant.userId,
        participant.name || participant.userId,
        participant.image
    );

    return (
        <div
            style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1px solid #1D1D1D',
            }}
        >
            <Image
                src={avatarUrl || getFallbackAvatar()}
                width={24}
                height={24}
                alt={`${participant.name || participant.userId}'s avatar`}
                className="object-cover"
                onError={(e) => {
                    e.currentTarget.src = getFallbackAvatar();
                }}
            />
        </div>
    );
});

OverflowParticipantAvatar.displayName = 'OverflowParticipantAvatar';

const OverflowIndicator = memo(
    ({ count, style, participants }: { count: number; style?: React.CSSProperties; participants: StreamVideoParticipant[] }) => {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    gap: '8px',
                    background: 'rgba(75, 75, 75, 0.5)',
                    backdropFilter: 'blur(5.7px)',
                    borderRadius: '1000px',
                    ...style,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', background: 'transparent', padding: '2px' }}>
                    {participants.slice(0, 3).map((participant, index) => (
                        <div
                            key={participant.sessionId}
                            style={{
                                marginLeft: index > 0 ? '-6px' : '0',
                                zIndex: 3 - index,
                            }}
                        >
                            <OverflowParticipantAvatar participant={participant} />
                        </div>
                    ))}
                </div>
                <span className="text-white text-sm">+{count}</span>
            </div>
        );
    }
);

OverflowIndicator.displayName = 'OverflowIndicator';

const GridLayout = () => {
    const call = useCall();
    const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const participants = useParticipants();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const { ref } = useAnimateVideoLayout(false);

    // Handle screen share cleanup
    useEffect(() => {
        if (!hasOngoingScreenShare && call) {
            const pinnedParticipant = participants.find(p => isPinned(p));
            if (pinnedParticipant && !hasScreenShare(pinnedParticipant)) {
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
        return [...participants].sort((a, b) => {
            if (a.isSpeaking && !b.isSpeaking) return -1;
            if (!a.isSpeaking && b.isSpeaking) return 1;
            if (hasScreenShare(a)) return -1;
            if (hasScreenShare(b)) return 1;
            if (isPinned(a)) return -1;
            if (isPinned(b)) return 1;
            const aHasBasename = a.userId.startsWith('0x');
            const bHasBasename = b.userId.startsWith('0x');
            if (aHasBasename && !bHasBasename) return -1;
            if (!aHasBasename && bHasBasename) return 1;
            return 0;
        });
    }, [participants]);

    const [visibleParticipants, overflowParticipants] = useMemo(() => {
        // First get speaking participants
        const speakingParticipants = sortedParticipants.filter(p => p.isSpeaking);
        const nonSpeakingParticipants = sortedParticipants.filter(p => !p.isSpeaking);

        // Show up to 4 participants
        const visible = [...speakingParticipants];
        if (visible.length < 4) {
            visible.push(...nonSpeakingParticipants.slice(0, 4 - visible.length));
        } else {
            visible.splice(4); // Limit to 4 participants
        }

        // Rest go to overflow
        const overflow = sortedParticipants.filter(p => !visible.includes(p));
        return [visible, overflow];
    }, [sortedParticipants]);

    // Update the overflow indicator rendering
    {overflowParticipants.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
            <OverflowIndicator
                count={overflowParticipants.length}
                style={{ display: 'flex', alignItems: 'center' }}
                participants={overflowParticipants}
            />
        </div>
    )}

    const getGridContainerStyles = (count: number) => {
        switch (count) {
            case 1:
                return {
                    display: 'grid',
                    width: '1231px',
                    height: '806px',
                    gridTemplateColumns: '1fr',
                };
            case 2:
                return {
                    display: 'grid',
                    width: '600px',
                    height: '782px',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '17px',
                };
            case 3:
                return {
                    display: 'grid',
                    width: '917px',
                    height: '587px',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gridTemplateRows: 'auto auto',
                    gap: '17px',
                };
            case 4:
                return {
                    display: 'grid',
                    width: '917px',
                    height: '587px',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '17px',
                };
            default:
                return {
                    display: 'grid',
                    width: '1231px',
                    height: '782px',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: '285px auto',
                    gap: '17px',
                };
        }
    };

    const getTileStyles = (index: number, count: number) => {
        const isSmallTile = count > 4 && index >= 4;
        const baseStyles = {
            boxSizing: 'border-box' as const,
            position: 'relative' as const,
            background: '#2A2A2A',
            borderRadius: '20px',
            padding: '13px 14px',
        };
        if (count === 1) {
            return { ...baseStyles, width: '1231px', height: '806px' };
        }
        if (count === 2) {
            return { ...baseStyles, width: '291.5px', height: '782px' };
        }
        if (count === 3 && index === 2) {
            return {
                ...baseStyles,
                width: '450px',
                height: '285px',
                gridColumn: 'span 2',
                justifySelf: 'center',
            };
        }
        if (isSmallTile) {
            return { ...baseStyles, width: '288.25px', height: '162px' };
        }
        return { ...baseStyles, width: count > 4 ? '600.5px' : '450px', height: '285px' };
    };

    const handleStopScreenShare = async (participant: StreamVideoParticipant) => {
        if (!call) return;
        try {
            if (call.screenShare) {
                await call.screenShare.toggle();
            }
            call.unpin(participant.sessionId);
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    };

    return (
        <div ref={ref} className="w-full relative overflow-hidden flex items-center justify-center">
            <div className={clsx(
                'flex flex-col items-start w-full bg-[#1D1D1D] rounded-[20px] relative',
                'p-2 sm:p-3',
                'gap-4 sm:gap-6',
                'sm:max-w-[1249px]',
                'mx-4',
                'h-[calc(100vh-270px)]',
                'sm:h-[calc(100vh-250px)]',
                'mt-[50px] mb-[100px]',
                'sm:mt-[42px] sm:mb-[120px]'
            )}
            >
                <div className={clsx(
                    'grid w-full h-full',
                    'gap-2 sm:gap-6',
                    visibleParticipants.length === 1 && 'grid-cols-1',
                    visibleParticipants.length === 2 && 'grid-cols-2',
                    visibleParticipants.length === 3 && 'grid-cols-2 grid-rows-2',
                    visibleParticipants.length >= 4 && 'grid-cols-2 grid-rows-2'
                )}>
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
                                participant={participant}
                                isScreenSharing={isScreenSharing}
                                onStopScreenShare={
                                    isScreenSharing
                                        ? () => handleStopScreenShare(participant)
                                        : undefined
                                }
                                style={{
                                    ...getTileStyles(
                                        index,
                                        Math.min(4, visibleParticipants.length)
                                    ),
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        );
                    })}

                    {overflowParticipants.length > 0 && (
                        <div className="absolute bottom-4 right-4 z-10">
                            <OverflowIndicator
                                count={overflowParticipants.length}
                                style={{ display: 'flex', alignItems: 'center' }}
                                participants={overflowParticipants}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GridLayout;
