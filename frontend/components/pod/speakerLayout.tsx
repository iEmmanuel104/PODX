import React, { useEffect, useState, useMemo, memo, ComponentType } from 'react';
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
    useParticipantViewContext,
    Audio,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { Mic, MicOff, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';
import { getBasename } from '@/app/apis/basenames';
import {
    useIsMobile,
    useDebounceSpeak,
    truncateUsername,
    useParticipantConsistentAvatar,
} from '../../hooks/useParticipantUtils';

interface ScreenShareUIProps {
    participant: StreamVideoParticipant;
    children: React.ReactNode;
}

// Add display name to the inline component
const ParticipantViewUIComponent = memo((props: ScreenShareUIProps) => (
    <div className="w-full h-full">{props.children}</div>
));
ParticipantViewUIComponent.displayName = 'ParticipantViewUIComponent';

interface ParticipantViewUIProps {
    participant: StreamVideoParticipant;
    children?: React.ReactNode;
    trackType?: 'videoTrack' | 'screenShareTrack';
}

// First define ScreenShareUI
const ScreenShareUI = memo<ScreenShareUIProps>(({ children, participant }) => {
    return <div className="relative w-full h-full">{children}</div>;
});
ScreenShareUI.displayName = 'ScreenShareUI';

// Then use it in ParticipantViewUIWrapper
const ParticipantViewUIWrapper = memo(() => {
    const { participant } = useParticipantViewContext();
    return (
        <div className="relative w-full h-full">
            {/* Your UI elements using participant from context */}
        </div>
    );
}) as ComponentType;
ParticipantViewUIWrapper.displayName = 'ParticipantViewUIWrapper';

// Move CustomParticipantViewUI outside the SpeakerLayout component and export it
const CustomParticipantViewUI = memo(() => {
    const { participant } = useParticipantViewContext();

    return (
        <div className="relative w-full h-full">
            <Audio participant={participant} />
        </div>
    );
}) as ComponentType;
CustomParticipantViewUI.displayName = 'CustomParticipantViewUI';

const SpeakerLayout = memo(() => {
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

    // const pinnedParticipant = useMemo(() => participants.find(p => isPinned(p)), [participants]);

    // Determine spotlight participant and others
    const [participantInSpotlight, ...otherParticipants] = useMemo(() => {
        const sortedParticipants = [...participants].sort((a, b) => {
            // First priority: screen sharing
            if (hasScreenShare(a)) return -1;
            if (hasScreenShare(b)) return 1;

            // Second priority: pinned
            if (isPinned(a)) return -1;
            if (isPinned(b)) return 1;

            // Third priority: speaking
            if (a.isSpeaking) return -1;
            if (b.isSpeaking) return 1;

            // Fourth priority: has basename (starts with 0x)
            const aHasBasename = a.userId.startsWith('0x');
            const bHasBasename = b.userId.startsWith('0x');
            if (aHasBasename && !bHasBasename) return -1;
            if (!aHasBasename && bHasBasename) return 1;

            return 0;
        });

        return sortedParticipants;
    }, [participants]);

    useEffect(() => {
        if (!call) return;

        const setupCall = async () => {
            try {
                // Wait for call state to be ready
                await new Promise(resolve => setTimeout(resolve, 500));

                // Set up sorting preset using Stream's API
                const customSortingPreset = combineComparators(screenSharing, pinned);
                await call.setSortParticipantsBy(customSortingPreset);
            } catch (error) {
                console.error('Error in call setup:', error);
            }
        };

        setupCall();
    }, [call]);

    useEffect(() => {
        if (!participantsBar || !call) return;

        let cleanup: (() => void) | undefined;

        const setupViewport = async () => {
            try {
                // Ensure call is ready before setting viewport
                await new Promise(resolve => setTimeout(resolve, 500));
                cleanup = call.dynascaleManager.setViewport(participantsBar);
            } catch (error) {
                console.error('Error setting viewport:', error);
            }
        };

        setupViewport();

        return () => {
            if (cleanup) cleanup();
        };
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

    // First, add this function to truncate the name to 6 characters
    const truncateNameTo6Chars = (name: string) => {
        if (name.startsWith('guest-')) {
            // Remove 'guest-' prefix and then take first 6 chars
            const username = name.slice(6);
            return `guest-${username.slice(0, 6)}${username.length > 6 ? '...' : ''}`;
        }
        // For non-guest names, just take first 6 chars
        return name.length > 6 ? `${name.slice(0, 6)}...` : name;
    };

    // First, update the ParticipantTile interface
    interface ParticipantTileProps {
        participant: StreamVideoParticipant;
        totalParticipants: number;
        index: number;
        style?: React.CSSProperties;
    }

    const ParticipantTile = React.memo(
        ({ participant, totalParticipants, index, style }: ParticipantTileProps) => {
            const isAudioEnabled = participant.publishedTracks.includes(1);
            const isSpeaking = participant.isSpeaking;
            const debouncedSpeaking = useDebounceSpeak(isSpeaking);
            const [displayName, setDisplayName] = useState(participant.name || participant.userId);
            const isMobile = useIsMobile();
            const { avatarUrl, getFallbackAvatar } = useParticipantConsistentAvatar(
                participant.userId,
                participant.name || participant.userId,
                participant.image
            );

            // Show all elements for first tile on mobile or all tiles on desktop
            const shouldShowAllElements = !isMobile || index === 0;
            // Show only mic and more options for second tile on mobile
            const shouldShowMinimalElements = isMobile && index === 1;

            useEffect(() => {
                const updateDisplayName = async () => {
                    const name = participant.name || participant.userId;
                    if (participant.userId.startsWith('0x')) {
                        try {
                            const basename = await getBasename(participant.userId as `0x${string}`);
                            if (basename) {
                                setDisplayName(basename);
                                return;
                            }
                        } catch (error) {
                            console.error('Error fetching basename:', error);
                        }
                    }
                    // If no basename or not an ethereum address, truncate
                    const truncated = await truncateUsername(name, participant.userId, isMobile);
                    setDisplayName(truncated);
                };

                updateDisplayName();
            }, [participant.name, participant.userId, isMobile]);

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

            return (
                <div
                    className={clsx(
                        'relative w-full h-full',
                        'flex items-center justify-center',
                        'bg-[#2A2A2A] rounded-xl overflow-hidden'
                    )}
                    style={style}
                >
                    {/* Participant Video or Avatar */}
                    <ParticipantView
                        participant={participant}
                        VideoPlaceholder={VideoPlaceholder}
                        className="w-full h-full"
                    />

                    {/* Status indicator */}
                    {(shouldShowAllElements || shouldShowMinimalElements) && (
                        <div className="absolute left-[14px] top-[13px] flex items-center p-[6px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px] z-10">
                            <div
                                style={{
                                    background: !isAudioEnabled
                                        ? '#FF3B30'
                                        : debouncedSpeaking
                                          ? '#5E5CE6'
                                          : '#808080',
                                    borderRadius: '50%',
                                    padding: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {!isAudioEnabled ? (
                                    <MicOff className="h-3 w-3 text-white" />
                                ) : (
                                    <Mic className="h-3 w-3 text-white" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* More Options */}
                    {(shouldShowAllElements || shouldShowMinimalElements) && (
                        <button
                            aria-label="More options"
                            className="absolute right-[14px] top-[13px] bg-transparent border-none cursor-pointer p-1 z-10"
                        >
                            <MoreHorizontal className="h-5 w-5 text-white/80" />
                        </button>
                    )}

                    {/* Name Label */}
                    {shouldShowAllElements && (
                        <div className="absolute left-[14px] bottom-[13px] flex items-center p-[6px] gap-2 bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]">
                            <span className="text-white text-sm px-1.5">{displayName}</span>
                        </div>
                    )}
                </div>
            );
        }
    );
    ParticipantTile.displayName = 'ParticipantTile';

    // First, let's properly type the MinimalParticipantUI component
    interface MinimalParticipantUIProps {
        children: React.ReactNode;
        participant: StreamVideoParticipant;
    }

    const MinimalParticipantUI = memo(({ children }: MinimalParticipantUIProps) => {
        return <div className="str-video__participant-view w-full h-full">{children}</div>;
    });
    MinimalParticipantUI.displayName = 'MinimalParticipantUI';

    // First, add the OverflowIndicator component from GridLayout
    const OverflowIndicator = ({ count }: { count: number }) => {
        return (
            <div className="flex items-center p-[6px_12px] gap-2 bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]">
                {/* Container for overlapping avatars */}
                <div className="flex items-center bg-transparent p-0.5">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
                            className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center -ml-1.5 first:ml-0 border border-[#1D1D1D]"
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
                {/* Overflow Count */}
                <span className="text-white text-sm">+{count}</span>
            </div>
        );
    };

    // Update the participant sorting and filtering logic
    const [visibleParticipants, overflowParticipants] = useMemo(() => {
        // First sort all participants
        const sortedParticipants = [...otherParticipants].sort((a, b) => {
            // Speaking participants first
            if (a.isSpeaking && !b.isSpeaking) return -1;
            if (!a.isSpeaking && b.isSpeaking) return 1;

            // Then basename users
            const aHasBasename = a.userId.startsWith('0x');
            const bHasBasename = b.userId.startsWith('0x');
            if (aHasBasename && !bHasBasename) return -1;
            if (!aHasBasename && bHasBasename) return 1;

            return 0;
        });

        // Get speaking participants first
        const speakingParticipants = sortedParticipants.filter(p => p.isSpeaking);
        const nonSpeakingParticipants = sortedParticipants.filter(p => !p.isSpeaking);

        // Show up to 2 participants: speaking ones first, then fill with non-speaking if needed
        const visible = [...speakingParticipants];
        if (visible.length < 2) {
            visible.push(...nonSpeakingParticipants.slice(0, 2 - visible.length));
        }

        // Rest go to overflow
        const overflow = sortedParticipants.filter(p => !visible.includes(p));

        return [visible, overflow];
    }, [otherParticipants]);

    // Then update the screen sharing section:
    if (hasOngoingScreenShare && screenSharingParticipant) {
        // Calculate visible and overflow participants for grid layout
        const maxVisibleParticipants = 3;
        const visibleGridParticipants = otherParticipants.slice(0, maxVisibleParticipants);
        const overflowGridParticipants = otherParticipants.slice(maxVisibleParticipants);

        return (
            <div ref={ref} className="w-full h-full relative overflow-hidden">
                <div className="h-full flex flex-col md:flex-row">
                    {/* Grid layout - horizontal on mobile, vertical on desktop */}
                    <div className="w-full md:w-1/4 md:min-w-[250px] h-28 md:h-full p-2 relative">
                        <div className="flex flex-row md:flex-col gap-2 h-full">
                            {visibleGridParticipants.map((participant, index) => (
                                <div
                                    key={participant.sessionId}
                                    className="relative h-full w-[calc(33.333%-5.333px)] md:w-full md:h-[calc(33.333%-5.333px)] flex-shrink-0 bg-[#2A2A2A] rounded-xl overflow-hidden"
                                >
                                    <ParticipantView
                                        participant={participant}
                                        trackType="videoTrack"
                                        ParticipantViewUI={CustomParticipantViewUI}
                                        VideoPlaceholder={VideoPlaceholder}
                                        muteAudio={false}
                                    />
                                    
                                    {/* Microphone Status */}
                                    <div className="absolute left-2 top-2 flex items-center p-[6px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px] z-10">
                                        <div
                                            className={clsx(
                                                'rounded-full p-[6px] flex items-center justify-center',
                                                {
                                                    'bg-[#FF3B30]': !participant.publishedTracks.includes(1),
                                                    'bg-[#5E5CE6]': participant.isSpeaking && participant.publishedTracks.includes(1),
                                                    'bg-[#808080]': !participant.isSpeaking && participant.publishedTracks.includes(1)
                                                }
                                            )}
                                        >
                                            {participant.publishedTracks.includes(1) ? (
                                                <Mic className="h-3 w-3 text-white" />
                                            ) : (
                                                <MicOff className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Participant Name */}
                                    <div className="absolute left-2 bottom-2 flex items-center p-[6px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px] z-10">
                                        <span className="text-white text-xs px-1.5">
                                            {participant.name || truncateUsername(participant.userId, participant.userId, true)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overflow indicator */}
                        {overflowGridParticipants.length > 0 && (
                            <div className="absolute right-4 bottom-4 z-10">
                                <OverflowIndicator count={overflowGridParticipants.length} />
                            </div>
                        )}
                    </div>

                    {/* Main content area with screen share */}
                    <div className="flex-1 min-h-0 w-full p-2">
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-full h-full relative rounded-xl overflow-hidden">
                                <ParticipantView
                                    participant={screenSharingParticipant}
                                    trackType="screenShareTrack"
                                    ParticipantViewUI={CustomParticipantViewUI}
                                    VideoPlaceholder={VideoPlaceholder}
                                    muteAudio={false}
                                />
                                
                                {/* Screen Sharing Participant Info */}
                                <div className="absolute left-4 top-4 flex items-center gap-2 z-10">
                                    {/* Microphone Status */}
                                    <div className="flex items-center p-[6px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]">
                                        <div
                                            className={clsx(
                                                'rounded-full p-[6px] flex items-center justify-center',
                                                {
                                                    'bg-[#FF3B30]': !screenSharingParticipant.publishedTracks.includes(1),
                                                    'bg-[#5E5CE6]': screenSharingParticipant.isSpeaking && screenSharingParticipant.publishedTracks.includes(1),
                                                    'bg-[#808080]': !screenSharingParticipant.isSpeaking && screenSharingParticipant.publishedTracks.includes(1)
                                                }
                                            )}
                                        >
                                            {screenSharingParticipant.publishedTracks.includes(1) ? (
                                                <Mic className="h-3 w-3 text-white" />
                                            ) : (
                                                <MicOff className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Name Label */}
                                    <div className="flex items-center p-[6px] bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]">
                                        <span className="text-white text-sm px-1.5">
                                            {screenSharingParticipant.name || truncateUsername(screenSharingParticipant.userId, screenSharingParticipant.userId, false)} (Sharing)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                trackType="videoTrack"
                                ParticipantViewUI={CustomParticipantViewUI}
                                VideoPlaceholder={VideoPlaceholder}
                                muteAudio={true}
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
                        trackType="videoTrack"
                        ParticipantViewUI={CustomParticipantViewUI}
                        VideoPlaceholder={VideoPlaceholder}
                        muteAudio={true}
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
                                name: truncateNameTo6Chars(
                                    participantInSpotlight.name || participantInSpotlight.userId
                                ),
                            }}
                            trackType="videoTrack"
                            ParticipantViewUI={CustomParticipantViewUI}
                            VideoPlaceholder={VideoPlaceholder}
                            muteAudio={true}
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
                            {/* Show visible participants */}
                            <div className="flex gap-4">
                                {visibleParticipants.map((participant, index) => (
                                    <div
                                        key={participant.sessionId}
                                        className="h-full aspect-[4/3] flex-shrink-0 bg-[#2A2A2A] rounded-xl overflow-hidden"
                                    >
                                        <ParticipantTile
                                            participant={participant}
                                            totalParticipants={2}
                                            index={index}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Show overflow indicator for remaining participants */}
                            {overflowParticipants.length > 0 && (
                                <div className="absolute right-4 bottom-4 z-10">
                                    <OverflowIndicator count={overflowParticipants.length} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

SpeakerLayout.displayName = 'SpeakerLayout';

export default SpeakerLayout;