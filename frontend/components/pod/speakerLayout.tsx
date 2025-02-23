import { useEffect, useState, useMemo } from 'react';
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

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

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
        if (screenSharingParticipant) {
            return [screenSharingParticipant, ...participants.filter(p => !hasScreenShare(p))];
        }
        if (pinnedParticipant) {
            return [pinnedParticipant, ...participants.filter(p => !isPinned(p))];
        }
        return participants;
    }, [screenSharingParticipant, pinnedParticipant, participants]);

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

    // Special layout for screen sharing
    if (hasOngoingScreenShare && screenSharingParticipant) {
        return (
            <div ref={ref} className="w-full h-full relative overflow-hidden">
                <div className="h-full p-2 md:p-4 flex flex-col">
                    {/* Main content area with screen share */}
                    <div className="flex-grow min-h-0 mb-2 flex items-center justify-center">
                        <div className="w-full h-full max-w-7xl mx-auto rounded-xl overflow-hidden">
                            <ParticipantView
                                participant={screenSharingParticipant}
                                trackType="screenShareTrack"
                                ParticipantViewUI={ParticipantViewUI}
                                VideoPlaceholder={VideoPlaceholder}
                            />
                        </div>
                    </div>

                    {/* Participants bar */}
                    {otherParticipants.length > 0 && (
                        <div className="h-32 flex-shrink-0">
                            <div
                                ref={setParticipantsBar}
                                className="flex gap-2 h-full overflow-x-auto justify-center"
                            >
                                {otherParticipants.map(participant => (
                                    <div
                                        key={participant.sessionId}
                                        className="h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden"
                                    >
                                        <ParticipantView
                                            participant={participant}
                                            trackType={
                                                hasScreenShare(participant)
                                                    ? 'screenShareTrack'
                                                    : 'videoTrack'
                                            }
                                            ParticipantViewUI={ParticipantViewUI}
                                            VideoPlaceholder={VideoPlaceholder}
                                        />
                                    </div>
                                ))}
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
                            participant={participantInSpotlight}
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
                    <div className="h-32 md:h-36">
                        <div
                            ref={setParticipantsBar}
                            className="flex gap-2 h-full overflow-x-auto justify-center"
                        >
                            {otherParticipants.map(participant => (
                                <div
                                    key={participant.sessionId}
                                    className="h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden"
                                >
                                    <ParticipantView
                                        participant={participant}
                                        trackType={
                                            hasScreenShare(participant)
                                                ? 'screenShareTrack'
                                                : 'videoTrack'
                                        }
                                        ParticipantViewUI={ParticipantViewUI}
                                        VideoPlaceholder={VideoPlaceholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpeakerLayout;
