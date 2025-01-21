// components/meeting/meetingFooter.tsx
'use client';

import React, { memo, useState } from 'react';
import ToggleAudioButton from '@/components/pod/ToggleAudioButton copy';
import ToggleVideoButton from '@/components/pod/ToggleVideoButton copy';
import CallControlButton from '@/components/pod/callControlButton';
import PresentToAll from '@/components/icons/PresentToAll';
import CallEndFilled from '@/components/icons/CallEndFilled';
import ReactionButton from '@/components/pod/EmojiButton';

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

                    {/* Replace Mood button with ReactionButton */}
                    <div className="hidden sm:block">
                        <ReactionButton />
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
