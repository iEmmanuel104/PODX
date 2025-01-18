import React from "react";
import { SpeakerLayout, PaginatedGridLayout, StreamVideoParticipant } from "@stream-io/video-react-sdk";

interface ResponsiveMeetingLayoutProps {
    hasOngoingScreenShare: boolean;
    isSpeaker: boolean;
    participants: StreamVideoParticipant[];
}

const ResponsiveMeetingLayout: React.FC<ResponsiveMeetingLayoutProps> = ({ hasOngoingScreenShare, isSpeaker, participants }) => {
    // Get breakpoints using window width
    const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
    const isMediumScreen = window.matchMedia("(min-width: 641px) and (max-width: 1024px)").matches;

    if (hasOngoingScreenShare || isSpeaker) {
        return (
            <div className="w-full h-full">
                <SpeakerLayout
                    participantsBarPosition={isSmallScreen ? "bottom" : "right"}
                    mirrorLocalParticipantVideo={true}
                    pageArrowsVisible={participants.length > (isSmallScreen ? 3 : 4)}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <PaginatedGridLayout
                
                mirrorLocalParticipantVideo={true}
                pageArrowsVisible={true}
            />
        </div>
    );
};

export default ResponsiveMeetingLayout;
