import React from "react";
import { CallParticipantResponse } from "@stream-io/video-react-sdk";
import Avatar from "@/components/meeting/participantAvatar";

interface CallParticipantsProps {
    participants: CallParticipantResponse[];
}

const AVATAR_SIZE = 32;

const CallParticipants: React.FC<CallParticipantsProps> = ({ participants }) => {
    const getText = () => {
        if (participants.length === 0) {
            return "No one else is here";
        } else if (participants.length === 1) {
            return `${participants[0].user.name || participants[0].user.id} is in this call`;
        } else {
            const names = participants.slice(0, 3).map((p) => p.user.name || p.user.id);
            if (participants.length > 4) {
                return `${names.join(", ")} and ${participants.length - 3} more are in this call`;
            } else if (participants.length === 4) {
                return `${names.join(", ")} and ${participants[3].user.name || participants[3].user.id} are in this call`;
            } else {
                return `${names.join(", ")} are in this call`;
            }
        }
    };

    return (
        <div className="flex flex-col items-start justify-center gap-2">
            <div className="flex items-center justify-start gap-2">
                {participants.slice(0, 3).map((p) => (
                    <Avatar key={p.user_session_id} participant={p} width={AVATAR_SIZE} />
                ))}
                {participants.length === 4 && <Avatar participant={participants[3]} width={AVATAR_SIZE} />}
                {participants.length > 4 && (
                    <div className="w-8 h-8 bg-[#6032F6] rounded-full flex items-center justify-center text-xs font-bold">
                        +{participants.length - 3}
                    </div>
                )}
            </div>
            <span className="text-[#A3A3A3] text-sm">{getText()}</span>
        </div>
    );
};

export default CallParticipants;
