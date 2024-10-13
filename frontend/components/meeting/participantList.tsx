import React, { useState, useMemo } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, DollarSign } from "lucide-react";
import { StreamVideoParticipant, OwnUserResponse, useCallStateHooks } from "@stream-io/video-react-sdk";

interface ParticipantsSidebarProps {
    participants: StreamVideoParticipant[];
    currentUser: OwnUserResponse | undefined;
    openTipModal: (name: string) => void;
    updateParticipantRole: (userId: string, newRole: string) => void;
    handleJoinRequest: (userId: string, accept: boolean) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
    participants,
    currentUser,
    openTipModal,
    updateParticipantRole,
    handleJoinRequest,
}) => {
    const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
    const { useCameraState, useMicrophoneState } = useCallStateHooks();

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            const getRoleWeight = (roles: string[]) => {
                if (roles.includes("host")) return 3;
                if (roles.includes("cohost")) return 2;
                if (roles.includes("user")) return 1;
                return 0;
            };
            return getRoleWeight(b.roles) - getRoleWeight(a.roles);
        });
    }, [participants]);

    const ParticipantItem: React.FC<{ participant: StreamVideoParticipant }> = ({ participant }) => {
        const { isMute: isAudioMuted } = useMicrophoneState();
        const { isMute: isVideoMuted } = useCameraState();
        const isCurrentUser = participant.userId === currentUser?.id;
        const role = participant.roles.includes("host")
            ? "host"
            : participant.roles.includes("cohost")
            ? "cohost"
            : participant.roles.includes("user")
            ? "user"
            : "listener";

        const isHost = role === "host";
        const isCohost = role === "cohost";
        const canPromote = (currentUser?.role.includes("host") || currentUser?.role.includes("cohost")) && !isHost && !isCohost;

        return (
            <div className="bg-[#2C2C2C] rounded-lg hover:bg-[#3C3C3C] transition-colors duration-200">
                <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center">
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">
                                {participant.name || participant.userId}
                                {isCurrentUser && <span className="text-gray-400 text-xs ml-1">(You)</span>}
                            </span>
                            <span className="text-gray-400 text-xs">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isAudioMuted ? "bg-[#7C3AED]" : "bg-red-500"}`}>
                            {!isAudioMuted ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                        </div>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${!isVideoMuted ? "bg-[#7C3AED]" : "bg-red-500"}`}
                        >
                            {!isVideoMuted ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
                        </div>
                        <ChevronDown
                            className="w-4 h-4 text-gray-400 ml-2 cursor-pointer"
                            onClick={() => setExpandedParticipant(expandedParticipant === participant.userId ? null : participant.userId)}
                        />
                    </div>
                </div>
                {expandedParticipant === participant.userId && !isCurrentUser && (
                    <div className="bg-[#3C3C3C] p-2 rounded-b-lg">
                        <button
                            className="w-full text-left text-white text-sm py-1 px-2 hover:bg-[#4C4C4C] rounded flex items-center"
                            onClick={() => openTipModal(participant.name || participant.userId)}
                        >
                            <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                            Tip
                        </button>
                        {canPromote && (
                            <button
                                className="w-full text-left text-white text-sm py-1 px-2 hover:bg-[#4C4C4C] rounded"
                                onClick={() => updateParticipantRole(participant.userId, "cohost")}
                            >
                                Promote to Co-host
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const pendingParticipants = sortedParticipants.filter((p) => p.roles.includes("pending"));

    return (
        <div className="w-80 bg-[#1E1E1E] p-4 mt-4 flex flex-col rounded-lg">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center">
                Participants
                <span className="bg-[#7C3AED] text-white text-xs px-2 py-0.5 rounded-full ml-2">{sortedParticipants.length}</span>
            </h2>
            {pendingParticipants.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-[#AFAFAF] text-sm font-semibold mb-2">Pending Requests</h3>
                    {pendingParticipants.map((participant) => (
                        <div key={participant.userId} className="flex items-center justify-between bg-[#2C2C2C] p-2 rounded-lg mb-2">
                            <span className="text-white text-sm">{participant.name || participant.userId}</span>
                            <div>
                                <button
                                    className="bg-green-500 text-white text-xs px-2 py-1 rounded mr-2"
                                    onClick={() => handleJoinRequest(participant.userId, true)}
                                >
                                    Accept
                                </button>
                                <button
                                    className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                                    onClick={() => handleJoinRequest(participant.userId, false)}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <h2 className="text-[#AFAFAF] text-medium font-semibold mb-4 mt-4 flex items-center">On the call</h2>
            <div className="flex-grow overflow-y-auto space-y-2">
                {sortedParticipants
                    .filter((p) => !p.roles.includes("pending"))
                    .map((participant) => (
                        <ParticipantItem key={participant.sessionId} participant={participant} />
                    ))}
            </div>
        </div>
    );
};

export default ParticipantsSidebar;
