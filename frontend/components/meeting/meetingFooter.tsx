'use client';

import React, { memo } from 'react';
import ToggleAudioButton from '@/components/pod/toggleAudioButton';
import ToggleVideoButton from '@/components/pod/toggleVideoButton';
import CallControlButton from '@/components/pod/callControlButton';
import ShareScreen from '@/public/images/icons/ShareScreen';
import EndCallIcon from '@/public/images/icons/EndCallIcon';
import { useApplaud } from '@/hooks/useApplaud';

interface MeetingFooterProps {
    leaveCall: () => void;
    toggleScreenShare: () => void;
    customData: Record<string, any>;
}

const MeetingFooter = memo<MeetingFooterProps>(({ leaveCall, toggleScreenShare, customData }) => {
    const isAudioSession = customData?.type === 'Audio Session';
    const { handleApplaud } = useApplaud('all');

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#151515] z-30">
            <div className="max-w-screen-xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <ToggleAudioButton />

                    {!isAudioSession && <ToggleVideoButton />}

                    {/* Replace Reaction button with Clap button */}
                    <CallControlButton
                        onClick={handleApplaud}
                        icon={<span className="text-2xl">👏</span>}
                        title="Applaud"
                        className="bg-[#6032F6] hover:bg-[#4C28C4]"
                    />

                    <CallControlButton
                        onClick={toggleScreenShare}
                        icon={<ShareScreen />}
                        title="Present now"
                        className="bg-[#2D2D2D] hover:bg-[#3D3D3D]"
                    />

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
