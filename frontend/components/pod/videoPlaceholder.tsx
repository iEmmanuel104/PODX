import { forwardRef } from 'react';
import Image from 'next/image';
import { useParticipantViewContext, type VideoPlaceholderProps } from '@stream-io/video-react-sdk';
import Avatar from '../meeting/participantAvatar';

export const placeholderClassName = 'participant-view-placeholder';

const PLACEHOLDER_COLORS = [
    'linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #9333EA 100%)', // Modern Indigo Fusion
    'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)', // Hyper Tech Blue
    'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)', // AI Green Burst
    'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)', // Neural Purple Flow
    'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #67E8F9 100%)', // Quantum Sky Blue
    'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', // Deep Neural Core
    'linear-gradient(135deg, #9333EA 0%, #7C3AED 33%, #6366F1 66%, #2563EB 100%)', // Violet Cosmos
    'linear-gradient(135deg, #10B981 0%, #059669 33%, #2563EB 66%, #3B82F6 100%)', // Cybernetic Green
    'linear-gradient(135deg, #A855F7 0%, #9333EA 33%, #7C3AED 66%, #4F46E5 100%)', // Psychedelic Purple
    'linear-gradient(135deg, #14B8A6 0%, #10B981 33%, #059669 66%, #2563EB 100%)', // Emerald Blue Wave
    'linear-gradient(135deg, #2563EB 0%, #3B82F6 33%, #6366F1 66%, #9333EA 100%)', // Deep Tech Vortex
    'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 33%, #2563EB 66%, #6366F1 100%)', // Oceanic Motion
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 33%, #6366F1 66%, #2563EB 100%)', // Electric Pink Storm
    'linear-gradient(135deg, #FACC15 0%, #F59E0B 33%, #EC4899 66%, #8B5CF6 100%)', // Sunset Circuit
    'linear-gradient(135deg, #2563EB 0%, #9333EA 33%, #EC4899 66%, #FACC15 100%)', // Neon Thunder
    'linear-gradient(135deg, #10B981 0%, #14B8A6 33%, #0EA5E9 66%, #2563EB 100%)', // Cyber Aqua
    'linear-gradient(135deg, #F43F5E 0%, #EC4899 33%, #A855F7 66%, #6366F1 100%)', // Infrared Pulse
    'linear-gradient(135deg, #22C55E 0%, #10B981 33%, #059669 66%, #2563EB 100%)', // Bio-Tech Green
    'linear-gradient(135deg, #4C1D95 0%, #7C3AED 33%, #9333EA 66%, #A855F7 100%)', // Cosmic Purple Glow
    'linear-gradient(135deg, #1E40AF 0%, #2563EB 33%, #38BDF8 66%, #67E8F9 100%)', // Skywave Motion
    'linear-gradient(135deg, #6366F1 0%, #A855F7 33%, #EC4899 66%, #FACC15 100%)', // Ultraviolet Sunset
    'linear-gradient(135deg, #7C3AED 0%, #6366F1 33%, #3B82F6 66%, #0EA5E9 100%)', // Cyber-Vortex
    'linear-gradient(135deg, #059669 0%, #10B981 33%, #22C55E 66%, #4ADE80 100%)', // AI Forest
    'linear-gradient(135deg, #9333EA 0%, #8B5CF6 33%, #3B82F6 66%, #0EA5E9 100%)', // Neon Depth
    'linear-gradient(135deg, #1E40AF 0%, #2563EB 33%, #0EA5E9 66%, #38BDF8 100%)', // Digital Ocean
    'linear-gradient(135deg, #D97706 0%, #F59E0B 33%, #FACC15 66%, #4ADE80 100%)', // Golden Circuitry
    'linear-gradient(135deg, #EC4899 0%, #A855F7 33%, #7C3AED 66%, #6366F1 100%)', // Hyperwave Magenta
    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 33%, #3B82F6 66%, #2563EB 100%)', // Cybernetic Pulse
    'linear-gradient(135deg, #9333EA 0%, #7C3AED 33%, #6366F1 66%, #2563EB 100%)', // AI Night Sky
    'linear-gradient(135deg, #4F46E5 0%, #6366F1 33%, #3B82F6 66%, #2563EB 100%)', // Deep Neural Spectrum
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
