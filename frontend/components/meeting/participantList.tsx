import React from "react";
import { ChevronDown } from "lucide-react";

interface Participant {
    name: string;
    role: "host" | "co-host" | "listener";
    isMuted: boolean;
}

interface ParticipantListProps {
    participants: Participant[];
    onTip: (participantName: string) => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, onTip }) => {
    return (
        <div className="w-64 bg-gray-800 p-4 flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">
                Participants <span className="bg-purple-600 text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span>
            </h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between mb-2 hover:bg-gray-700 p-2 rounded">
                        <div>
                            <span className="text-sm">{participant.name}</span>
                            {participant.role !== "listener" && <span className="text-xs text-gray-400 ml-1">({participant.role})</span>}
                        </div>
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${participant.isMuted ? "bg-red-500" : "bg-green-500"} mr-2`}></div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParticipantList;
