import React from 'react';
import Avatar from '@/components/meeting/participantAvatar';

import { CallParticipantResponse, MemberResponse } from '@stream-io/video-react-sdk';

interface CallParticipantsProps {
    participants: CallParticipantResponse[] | MemberResponse[];
}

const AVATAR_SIZE = 24; // Reduced from 32 to 24

const CallParticipants: React.FC<CallParticipantsProps> = ({ participants }) => {
    const getText = () => {
        if (participants.length === 0) {
            return 'No one else is here';
        } else if (participants.length === 1) {
            return `${participants[0].user.name || participants[0].user.id} is in this call`;
        } else {
            const names = participants.slice(0, 3).map(p => p.user.name || p.user.id);
            if (participants.length > 4) {
                return `${names.join(', ')} and ${participants.length - 3} more are in this call`;
            } else if (participants.length === 4) {
                return `${names.join(', ')} and ${participants[3].user.name || participants[3].user.id} are in this call`;
            } else {
                return `${names.join(', ')} are in this call`;
            }
        }
    };

    return (
        <div className="flex items-center justify-center md:justify-start gap-2 mb-16">
            <div className="flex items-center justify-start -space-x-1">
                {participants.slice(0, 3).map((p) => (
                    <Avatar key={(p as CallParticipantResponse).user_session_id || p.user.id} participant={p} width={AVATAR_SIZE} />
                ))}
            </div>
            <span className="text-sm text-gray-400">{getText()}</span>
        </div>
    );
};

export default CallParticipants;
