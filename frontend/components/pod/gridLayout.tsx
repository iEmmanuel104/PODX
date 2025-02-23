// GridLayout.tsx
import { useMemo, useEffect } from 'react';
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
import clsx from 'clsx';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

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

    const getLayoutConfig = (count: number) => {
        switch(count) {
            case 1: return 'single';
            case 2: return 'double';
            case 3: return 'triple';
            case 4: return 'quad';
            default: return 'overflow';
        }
    };

    const layoutType = getLayoutConfig(sortedParticipants.length);
    const overflowCount = Math.max(sortedParticipants.length - 4, 0);

    const OverflowIndicator = ({ count }: { count: number }) => (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2D2D2D] rounded-xl">
            <div className="flex items-center">
                {/* Three overlapping circles */}
                <div className="relative flex items-center">
                    {/* First circle */}
                    <div className="w-12 h-12 rounded-full bg-gray-400 border-2 border-[#2D2D2D] relative z-30">
                        <div className="w-full h-full rounded-full bg-gray-200" />
                    </div>
                    {/* Second circle */}
                    <div className="w-12 h-12 rounded-full bg-gray-400 border-2 border-[#2D2D2D] -ml-6 relative z-20">
                        <div className="w-full h-full rounded-full bg-gray-300" />
                    </div>
                    {/* Third circle */}
                    <div className="w-12 h-12 rounded-full bg-gray-400 border-2 border-[#2D2D2D] -ml-6 relative z-10">
                        <div className="w-full h-full rounded-full bg-gray-400" />
                    </div>
                </div>
                {/* Count indicator - shows number of additional participants beyond 4 */}
                {count > 0 && (
                    <span className="ml-3 text-2xl font-medium text-white">
                        +{count}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div ref={ref} className="w-full h-full relative overflow-hidden p-4">
            <div className={clsx(
                'grid w-full h-full gap-4',
                layoutType === 'single' && 'grid-cols-1 grid-rows-1',
                layoutType === 'double' && 'grid-cols-2 grid-rows-1 gap-x-14',
                layoutType === 'triple' && 'grid-cols-2 grid-rows-2 gap-4',
                layoutType === 'quad' && 'grid-cols-2 grid-rows-2',
                layoutType === 'overflow' && 'grid-cols-2 grid-rows-2'
            )}>
                {sortedParticipants.slice(0, 4).map((participant, index) => (
                    <div
                        key={participant.sessionId}
                        className={clsx(
                            'relative rounded-xl overflow-hidden transition-all duration-300 ease-in-out',
                            layoutType === 'single' && 'w-full h-full',
                            layoutType === 'double' && 'w-full h-full',
                            layoutType === 'triple' && index === 2 && [
                                'w-[calc(50%-8px)]',
                                'h-full',
                                'mx-auto',
                                'col-span-2'
                            ],
                            layoutType === 'overflow' && index === 3 && 'relative'
                        )}
                    >
                        <ParticipantView
                            participant={participant}
                            trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
                            ParticipantViewUI={ParticipantViewUI}
                            VideoPlaceholder={VideoPlaceholder}
                        />
                        {layoutType === 'overflow' && index === 3 && overflowCount > 0 && (
                            <OverflowIndicator count={overflowCount} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GridLayout;
