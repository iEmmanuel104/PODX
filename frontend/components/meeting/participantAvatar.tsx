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

interface AvatarProps {
    participant: CallParticipantResponse | MemberResponse;
    width: number;
}

const Avatar: React.FC<AvatarProps> = ({ participant, width }) => {
    // Use useMemo to keep the same avatar for the same user
    const randomAvatar = useMemo(() => {
        // Use participant ID to generate consistent random index for each user
        const randomIndex = Math.abs(
            participant.user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) % avatarImages.length;
        return avatarImages[randomIndex];
    }, [participant.user.id]);

    const initials = participant.user.name
        ? participant.user.name.slice(0, 2).toUpperCase()
        : participant.user.id.slice(0, 2).toUpperCase();

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
