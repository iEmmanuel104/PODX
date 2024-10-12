import React, { useState } from "react";
import { ChevronDown, Mic, MicOff } from "lucide-react";

interface Participant {
    name: string;
    role: "host" | "co-host" | "listener" | "speaker";
    isMuted: boolean;
}

interface ParticipantsSidebarProps {
    participants: Participant[];
    currentUser: Participant;
    openTipModal: (name: string) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({ participants, currentUser, openTipModal }) => {
    const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

    const ParticipantItem: React.FC<{ participant: Participant }> = ({ participant }) => (
        <div
            className="flex items-center justify-between py-3 px-4 bg-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors duration-200 relative"
            onMouseEnter={() => setHoveredParticipant(participant.name)}
            onMouseLeave={() => setHoveredParticipant(null)}
        >
            <div className="flex items-center">
                <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">
                        {participant.name}
                        {participant.name === currentUser.name && <span className="text-gray-400 text-xs ml-1">(You)</span>}
                    </span>
                    <span className="text-gray-400 text-xs">
                        {participant.role === "host"
                            ? "Session Host"
                            : participant.role === "co-host"
                            ? "Co-host"
                            : participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                    </span>
                </div>
            </div>
            <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${participant.isMuted ? "bg-red-500" : "bg-[#7C3AED]"}`}>
                    {participant.isMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
            </div>
            {hoveredParticipant === participant.name &&
                currentUser.role === "listener" &&
                (participant.role === "host" || participant.role === "co-host") && (
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#7C3AED] text-white text-xs py-1 px-3 rounded-full"
                        onClick={() => openTipModal(participant.name)}
                    >
                        Tip
                    </button>
                )}
        </div>
    );

    return (
        <div className="w-80 bg-[#1E1E1E] p-4 mt-4 flex flex-col rounded-lg">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center">
                Participants
                <span className="bg-[#7C3AED] text-white text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span>
            </h2>
            <h2 className="text-[#AFAFAF] text-medium font-semibold mb-4 mt-4 flex items-center">On the call</h2>
            <div className="flex-grow overflow-y-auto space-y-2">
                {participants.map((participant, index) => (
                    <ParticipantItem key={index} participant={participant} />
                ))}
            </div>
        </div>
    );
};

export default ParticipantsSidebar;
