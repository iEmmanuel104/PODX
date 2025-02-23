// GridLayout.tsx
import { useMemo } from 'react';
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
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import ParticipantViewUI from './participantViewUI';
import useAnimateVideoLayout from '../../hooks/useAnimateVideoLayout';
import VideoPlaceholder from './videoPlaceholder';

const GridLayout = () => {
    const call = useCall();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const { ref } = useAnimateVideoLayout(false);

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
                layoutType === 'triple' && 'grid-rows-2 grid-cols-2',
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
                            layoutType === 'triple' && index === 2 && 'col-span-2 row-start-2 h-[calc(50%-7px)]',
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
                {layoutType === 'triple' && sortedParticipants.length === 3 && (
                    <div className="col-span-2 row-start-2 h-[calc(50%-7px)]" />
                )}
            </div>
        </div>
    );
};

export default GridLayout;
