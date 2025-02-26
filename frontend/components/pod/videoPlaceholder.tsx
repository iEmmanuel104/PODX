import { forwardRef } from 'react';
import Image from 'next/image';
import { useParticipantViewContext, type VideoPlaceholderProps } from '@stream-io/video-react-sdk';
import Avatar from '../meeting/participantAvatar';

export const placeholderClassName = 'participant-view-placeholder';

const PLACEHOLDER_COLORS = [
    'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)', // Modern Indigo
    'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)', // Tech Blue
    'linear-gradient(135deg, #059669 0%, #10B981 100%)', // AI Green
    'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', // Neural Purple
    'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', // Quantum Blue
    'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', // Deep Neural
];

const VideoPlaceholder = forwardRef<HTMLDivElement, VideoPlaceholderProps>(
    function VideoPlaceholder({ style }, ref) {
        const { participant } = useParticipantViewContext();

        return (
            <div
                ref={ref}
                style={style}
                className="absolute inset-0 bg-[#2A2A2A] flex items-center justify-center"
            >
                <Avatar participant={participant} width={80} />
            </div>
        );
    }
);

export default VideoPlaceholder;
