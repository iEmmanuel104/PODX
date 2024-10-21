import React from "react";
import { CallParticipantResponse, MemberResponse } from "@stream-io/video-react-sdk";

interface AvatarProps {
    participant: CallParticipantResponse | MemberResponse;  
    width: number;
}

const Avatar: React.FC<AvatarProps> = ({ participant, width }) => {
    const initials = participant.user.name ? participant.user.name.slice(0, 2).toUpperCase() : participant.user.id.slice(0, 2).toUpperCase();

    return (
        <div
            className="bg-[#6032F6] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${width}px`, height: `${width}px` }}
        >
            {initials}
        </div>
    );
};

export default Avatar;
