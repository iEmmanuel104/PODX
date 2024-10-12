import React, { useEffect, useMemo, useState } from "react";
import {
    ParticipantView,
    StreamVideoParticipant,
    useCall,
    useCallStateHooks,
    combineComparators,
    Comparator,
    pinned,
} from "@stream-io/video-react-sdk";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import clsx from "clsx";

const GROUP_SIZE = 6;

const GridLayout: React.FC = () => {
    const call = useCall();
    const { useParticipants, useLocalParticipant, useDominantSpeaker } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const dominantSpeaker = useDominantSpeaker();
    const [page, setPage] = useState(0);

    const pageCount = useMemo(() => Math.ceil(participants.length / GROUP_SIZE), [participants]);

    const participantGroups = useMemo(() => {
        const groups = [];
        for (let i = 0; i < participants.length; i += GROUP_SIZE) {
            groups.push(participants.slice(i, i + GROUP_SIZE));
        }
        return groups;
    }, [participants]);

    const selectedGroup = participantGroups[page];

    useEffect(() => {
        if (!call) return;
        const customSortingPreset = getCustomSortingPreset();
        call.setSortParticipantsBy(customSortingPreset);
    }, [call]);

    useEffect(() => {
        if (page > pageCount - 1) {
            setPage(Math.max(0, pageCount - 1));
        }
    }, [page, pageCount]);

    const getCustomSortingPreset = (): Comparator<StreamVideoParticipant> => {
        return combineComparators(pinned);
    };

    const ParticipantTile: React.FC<{ participant: StreamVideoParticipant }> = ({ participant }) => {
        const isLocal = participant.userId === localParticipant?.userId;
        const isDominant = participant.userId === dominantSpeaker?.userId;
        const { useMicrophoneState, useCameraState } = useCallStateHooks();
        const micState = useMicrophoneState();
        const cameraState = useCameraState();

        return (
            <div
                className={clsx("relative aspect-video bg-[#2C2C2C] rounded-lg overflow-hidden", {
                    "border-2 border-blue-500": isDominant,
                    "border-2 border-green-500": isLocal,
                })}
            >
                <ParticipantView participant={participant} />
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${!micState.isMute ? "bg-[#7C3AED]" : "bg-red-500"}`}>
                        {!micState.isMute ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${!cameraState.isMute ? "bg-[#7C3AED]" : "bg-red-500"}`}>
                        {!cameraState.isMute ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-white" />}
                    </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded-full">
                        {participant.name || participant.userId}
                        {isLocal && " (You)"}
                    </span>
                    {isDominant && <span className="text-white text-xs bg-blue-500 bg-opacity-50 px-2 py-1 rounded-full">Speaking</span>}
                </div>
            </div>
        );
    };

    return (
        <div className={clsx("w-full relative overflow-hidden", "str-video__paginated-grid-layout")}>
            {pageCount > 1 && (
                <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#2C2C2C] text-white rounded-full p-2"
                    disabled={page === 0}
                    onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                >
                    &lt;
                </button>
            )}
            <div
                className={clsx("str-video__paginated-grid-layout__group", {
                    "str-video__paginated-grid-layout--one": selectedGroup.length === 1,
                    "str-video__paginated-grid-layout--two-four": selectedGroup.length >= 2 && selectedGroup.length <= 4,
                    "str-video__paginated-grid-layout--five-nine": selectedGroup.length >= 5 && selectedGroup.length <= 9,
                })}
            >
                {call && selectedGroup.length > 0 && (
                    <>
                        {selectedGroup.map((participant) => (
                            <ParticipantTile key={participant.sessionId} participant={participant} />
                        ))}
                    </>
                )}
            </div>
            {pageCount > 1 && (
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2C2C2C] text-white rounded-full p-2"
                    disabled={page === pageCount - 1}
                    onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
                >
                    &gt;
                </button>
            )}
        </div>
    );
};

export default GridLayout;
