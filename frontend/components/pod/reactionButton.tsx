// components/pod/ReactionButton.tsx
import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import CallControlButton from './callControlButton';
import Mood from '../icons/Mood';

const reactions = [
    { type: 'like', emoji: '👍' },
    { type: 'celebrate', emoji: '🎉' },
    { type: 'raise-hand', emoji: '✋' },
    { type: 'heart', emoji: '❤️' },
    { type: 'clap', emoji: '👏' },
];

interface ReactionButtonProps {
    className?: string;
}

const ReactionButton = ({ className }: ReactionButtonProps) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const call = useCall();

    const sendReaction = async (type: string, emoji: string) => {
        try {
            await call?.sendReaction({
                type,
                emoji_code: emoji,
                custom: {
                    duration: 3000, // reaction will show for 3 seconds
                },
            });
            setShowDropdown(false);
        } catch (error) {
            console.error('Failed to send reaction:', error);
        }
    };

    return (
        <div className="relative">
            <CallControlButton
                icon={<Mood className="w-5 h-5 sm:w-6 sm:h-6" />}
                title="Send a reaction"
                className={`bg-[#2D2D2D] hover:bg-[#3D3D3D] ${className}`}
                onClick={() => setShowDropdown(!showDropdown)}
            />

            {showDropdown && (
                <div className="absolute bottom-full mb-2 p-2 bg-[#2D2D2D] rounded-lg shadow-lg">
                    <div className="flex gap-2">
                        {reactions.map(({ type, emoji }) => (
                            <button
                                key={type}
                                onClick={() => sendReaction(type, emoji)}
                                className="p-2 hover:bg-[#3D3D3D] rounded-lg transition-colors"
                            >
                                <span className="text-xl">{emoji}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReactionButton;
