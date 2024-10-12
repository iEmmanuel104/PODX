import React, { useState } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { StreamVideoParticipant, OwnUserResponse, useCallStateHooks } from "@stream-io/video-react-sdk";

interface ParticipantsSidebarProps {
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (name: string) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({ participants, currentUser, openTipModal }) => {
    const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
    const { useCameraState, useMicrophoneState } = useCallStateHooks();

    const ParticipantItem: React.FC<{ participant: StreamVideoParticipant }> = ({ participant }) => {
        const { isMute: isAudioMuted } = useMicrophoneState();
        const { isMute: isVideoMuted } = useCameraState();
        const isCurrentUser = participant.userId === currentUser?.id;
        const role = participant.roles[0] || "listener";
        const isHost = participant.roles.includes("host") || participant.isLocalParticipant;

        return (
            <div
                className="flex items-center justify-between py-3 px-4 bg-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors duration-200 relative"
                onMouseEnter={() => setHoveredParticipant(participant.userId)}
                onMouseLeave={() => setHoveredParticipant(null)}
            >
                <div className="flex items-center">
                    <div className="flex flex-col">
                        <span className="text-white text-sm font-medium">
                            {participant.name || participant.userId}
                            {isCurrentUser && <span className="text-gray-400 text-xs ml-1">(You)</span>}
                        </span>
                        <span className="text-gray-400 text-xs">{isHost ? "Session Host" : role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isAudioMuted ? "bg-[#7C3AED]" : "bg-red-500"}`}>
                        {!isAudioMuted ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${!isVideoMuted ? "bg-[#7C3AED]" : "bg-red-500"}`}>
                        {!isVideoMuted ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                </div>
                {hoveredParticipant === participant.userId && !isCurrentUser && (isHost || role === "host") && (
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#7C3AED] text-white text-xs py-1 px-3 rounded-full"
                        onClick={() => openTipModal(participant.name || participant.userId)}
                    >
                        Tip
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="w-80 bg-[#1E1E1E] p-4 mt-4 flex flex-col rounded-lg">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center">
                Participants
                <span className="bg-[#7C3AED] text-white text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span>
            </h2>
            <h2 className="text-[#AFAFAF] text-medium font-semibold mb-4 mt-4 flex items-center">On the call</h2>
            <div className="flex-grow overflow-y-auto space-y-2">
                {participants.map((participant) => (
                    <ParticipantItem key={participant.sessionId} participant={participant} />
                ))}
            </div>
        </div>
    );
};

export default ParticipantsSidebar;
