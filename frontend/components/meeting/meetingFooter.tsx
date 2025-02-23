'use client';

import React, { memo } from 'react';
import ToggleAudioButton from '@/components/pod/toggleAudioButton';
import ToggleVideoButton from '@/components/pod/toggleVideoButton';
import CallControlButton from '@/components/pod/callControlButton';
import ShareScreen from '@/public/images/icons/ShareScreen';
import EndCallIcon from '@/public/images/icons/EndCallIcon';
import ReactionIcon from '@/public/images/icons/ReactionIcon';

interface MeetingFooterProps {
    leaveCall: () => void;
    toggleScreenShare: () => void;
    customData: Record<string, any>;
}

const MeetingFooter = memo<MeetingFooterProps>(({ leaveCall, toggleScreenShare, customData }) => {
    const isAudioSession = customData?.type === 'Audio Session';

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-sm z-50">
            <div className="max-w-screen-xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {/* Audio Control */}
                    <ToggleAudioButton />

                    {/* Video Control - Only show if not an audio session */}
                    {!isAudioSession && <ToggleVideoButton />}

                    {/* Replace Mood button with ReactionButton */}
                    <div className="flex bg-[#6032F6] hover:[#6032F6] h-14 w-14 rounded-full items-center justify-center hover:cursor-pointer">
                        <ReactionIcon />
                    </div>

                    {/* Screen Share */}
                    <CallControlButton
                        onClick={toggleScreenShare}
                        icon={<ShareScreen />}
                        title="Present now"
                        className="bg-[#2D2D2D] hover:bg-[#3D3D3D]"
                    />

                    {/* Leave Call */}
                    <CallControlButton
                        onClick={leaveCall}
                        icon={<EndCallIcon />}
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
