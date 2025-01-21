'use client';

import React, { memo } from 'react';
import ToggleAudioButton from '@/components/pod/ToggleAudioButton copy';
import ToggleVideoButton from '@/components/pod/ToggleVideoButton copy';
import CallControlButton from '@/components/pod/CallControlButton';
import Mood from '@/components/icons/Mood';
import PresentToAll from '@/components/icons/PresentToAll';
import CallEndFilled from '@/components/icons/CallEndFilled';

interface MeetingFooterProps {
    leaveCall: () => void;
    toggleScreenShare: () => void;
}

const MeetingFooter = memo<MeetingFooterProps>(({ leaveCall, toggleScreenShare }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-sm">
            <div className="max-w-screen-xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {/* Audio Control */}
                    <ToggleAudioButton />

                    {/* Video Control */}
                    <ToggleVideoButton />

                    {/* Reactions - Hidden on mobile */}
                    <div className="hidden sm:block">
                        <CallControlButton
                            icon={<Mood className="w-5 h-5 sm:w-6 sm:h-6" />}
                            title="Send a reaction"
                            className="bg-[#2D2D2D] hover:bg-[#3D3D3D]"
                        />
                    </div>

                    {/* Screen Share */}
                    <CallControlButton
                        onClick={toggleScreenShare}
                        icon={<PresentToAll className="w-5 h-5 sm:w-6 sm:h-6" />}
                        title="Present now"
                        className="bg-[#2D2D2D] hover:bg-[#3D3D3D]"
                    />

                    {/* Leave Call */}
                    <CallControlButton
                        onClick={leaveCall}
                        icon={<CallEndFilled className="w-5 h-5 sm:w-6 sm:h-6" />}
                        title="Leave call"
                        className="bg-red-500 hover:bg-red-600"
                    />
                </div>
            </div>
        </div>
    );
});

MeetingFooter.displayName = 'MeetingFooter';

export default MeetingFooter;
