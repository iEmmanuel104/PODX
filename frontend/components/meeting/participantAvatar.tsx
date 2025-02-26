import React, { useMemo } from 'react';
import { CallParticipantResponse, MemberResponse } from '@stream-io/video-react-sdk';
import Image from 'next/image';

// Array of avatar images
const avatarImages = [
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
    '/avatars/avatar6.png',
    '/avatars/avatar7.png',
    '/avatars/avatar8.png',
    '/avatars/avatar9.png',
    '/avatars/avatar10.png',
];

import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

interface AvatarProps {
    participant: StreamVideoParticipant;
    width: number;
}

const Avatar: React.FC<AvatarProps> = ({ participant, width }) => {
    const randomAvatar = useMemo(() => {
        // Add null check and provide a fallback value
        const userId = participant?.userId || 'default';
        const randomIndex =
            Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
            avatarImages.length;
        return avatarImages[randomIndex];
    }, [participant?.userId]);

    const initials = participant.name
        ? participant.name.slice(0, 2).toUpperCase()
        : participant.userId.slice(0, 2).toUpperCase();

    return (
        <div
            className="relative bg-[#6032F6] rounded-full overflow-hidden"
            style={{ width: `${width}px`, height: `${width}px` }}
        >
            <Image
                src={randomAvatar}
                alt={initials}
                width={width}
                height={width}
                className="rounded-full object-cover"
                priority
            />
        </div>
    );
};

export default Avatar;
