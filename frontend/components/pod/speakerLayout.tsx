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

    // Special layout for screen sharing
    if (hasOngoingScreenShare && screenSharingParticipant) {
        return (
            <div ref={ref} className="w-full h-full relative overflow-hidden">
                <div className="h-full p-2 flex flex-col">
                    <div className="flex-grow min-h-0 mb-2">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <ParticipantView
                                participant={screenSharingParticipant}
                                trackType="screenShareTrack"
                                ParticipantViewUI={ParticipantViewUI}
                                VideoPlaceholder={VideoPlaceholder}
                            />
                        </div>
                    </div>

                    {otherParticipants.length > 0 && (
                        <div className="h-32 flex-shrink-0">
                            <div
                                ref={setParticipantsBar}
                                className="flex gap-2 h-full overflow-x-auto"
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

    if (participants.length <= 4) {
        return (
            <div ref={ref} className="w-full h-full">
                <div
                    className={clsx(
                        'grid w-full h-full gap-2 transition-all duration-300 ease-in-out',
                        participants.length === 1 ? 'p-0' : 'p-2',
                        participants.length === 1
                            ? 'grid-cols-1'
                            : participants.length === 2
                              ? 'grid-cols-2 h-screen'
                              : 'grid-cols-2 grid-rows-2'
                    )}
                >
                    {participants.map(participant => (
                        <div
                            key={participant.sessionId}
                            className={clsx(
                                'relative rounded-xl overflow-hidden transition-transform duration-300',
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

    return (
        <div
            ref={ref}
            className="w-full h-full relative overflow-hidden str-video__speaker-layout str-video__speaker-layout--variant-bottom"
        >
            <div className="str-video__speaker-layout__wrapper p-2">
                <div
                    className={clsx(
                        'str-video__speaker-layout__spotlight rounded-xl overflow-hidden mb-2 transition-transform duration-300',
                        isPinned(participantInSpotlight) && 'scale-100 hover:scale-[1.02]'
                    )}
                >
                    {call && participantInSpotlight && (
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
                    )}
                </div>
                {/* Other participants */}
                {call && otherParticipants.length > 0 && (
                    <div className="h-32 transition-all duration-300 ease-in-out">
                        <div ref={setParticipantsBar} className="flex gap-2 h-full overflow-x-auto">
                            {otherParticipants.map(participant => (
                                <div
                                    key={participant.sessionId}
                                    className="h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
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