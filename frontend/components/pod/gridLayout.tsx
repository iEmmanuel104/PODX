// GridLayout.tsx
import { useEffect, useMemo, useState } from 'react';
import {
    combineComparators,
    Comparator,
    IconButton,
    ParticipantView,
    pinned,
    screenSharing,
    StreamVideoParticipant,
    useCall,
    useCallStateHooks,
    isPinned,
    hasScreenShare,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

const GROUP_SIZE = 6;

const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-2 grid-rows-1 max-w-5xl mx-auto';
    if (count === 3 || count === 4) return 'grid-cols-2 grid-rows-2';
    if (count >= 5) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-1 grid-rows-1';
};

const GridLayout = () => {
    const call = useCall();
    const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const participants = useParticipants();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const [page, setPage] = useState(0);
    const { ref } = useAnimateVideoLayout(false);

    // All hooks must be called at the top level
    const pageCount = useMemo(() => Math.ceil(participants.length / GROUP_SIZE), [participants]);
    const participantGroups = useMemo(() => {
        const groups = [];
        for (let i = 0; i < participants.length; i += GROUP_SIZE) {
            groups.push(participants.slice(i, i + GROUP_SIZE));
        }
        return groups;
    }, [participants]);

    // Find screen sharing participant using hasScreenShare helper
    const screenSharingParticipant = useMemo(
        () => participants.find(p => hasScreenShare(p)),
        [participants]
    );

    useEffect(() => {
        if (!call) return;
        const customSortingPreset = combineComparators(screenSharing, pinned);
        call.setSortParticipantsBy(customSortingPreset);
    }, [call]);

    useEffect(() => {
        if (page > pageCount - 1) {
            setPage(Math.max(0, pageCount - 1));
        }
    }, [page, pageCount]);

    const selectedGroup = participantGroups[page];

    const getParticipantClass = (participant: StreamVideoParticipant, totalCount: number) => {
        const baseClasses =
            'relative rounded-xl overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center';

        if (totalCount === 1) {
            return clsx(baseClasses, 'w-full h-full max-w-4xl mx-auto');
        }

        if (totalCount === 2) {
            return clsx(
                baseClasses,
                'w-full h-[70vh] md:h-[80vh]',
                'my-auto',
                isPinned(participant) && 'hover:scale-[1.02]'
            );
        }

        return clsx(baseClasses, 'w-full h-full', isPinned(participant) && 'hover:scale-[1.02]');
    };

    // Render screen share layout
    if (hasOngoingScreenShare && screenSharingParticipant) {
        return (
            <div ref={ref} className="w-full h-full relative overflow-hidden">
                <div className="h-full p-2 md:p-4 grid grid-rows-[1fr,auto] gap-2 md:gap-4">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full h-full max-w-7xl mx-auto rounded-xl overflow-hidden">
                            <ParticipantView
                                participant={screenSharingParticipant}
                                trackType="screenShareTrack"
                                ParticipantViewUI={ParticipantViewUI}
                                VideoPlaceholder={VideoPlaceholder}
                            />
                        </div>
                    </div>

                    <div className="h-32 md:h-36">
                        <div className="flex gap-2 h-full overflow-x-auto justify-center">
                            {participants
                                .filter(p => !hasScreenShare(p))
                                .map(participant => (
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
                </div>
            </div>
        );
    }

    // Regular grid layout render
    return (
        <div ref={ref} className="w-full h-full relative overflow-hidden">
            {pageCount > 1 && (
                <IconButton
                    icon="caret-left"
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                />
            )}
            <div
                className={clsx(
                    'grid w-full h-full gap-2 md:gap-4 p-2 md:p-4',
                    getGridLayout(selectedGroup?.length || 0),
                    'max-w-7xl mx-auto'
                )}
            >
                {call && selectedGroup?.length > 0 && (
                    <>
                        {selectedGroup.map(participant => (
                            <div
                                key={participant.sessionId}
                                className={getParticipantClass(participant, selectedGroup.length)}
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
                    </>
                )}
            </div>
            {pageCount > 1 && (
                <IconButton
                    disabled={page === pageCount - 1}
                    icon="caret-right"
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                />
            )}
        </div>
    );
};

export default GridLayout;
