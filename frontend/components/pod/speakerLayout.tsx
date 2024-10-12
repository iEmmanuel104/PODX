import React, { useEffect, useState } from "react";
import { ParticipantView, StreamVideoParticipant, useCall, useCallStateHooks } from "@stream-io/video-react-sdk";

const SpeakerLayout: React.FC = () => {
    const call = useCall();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const [participantsBar, setParticipantsBar] = useState<HTMLDivElement | null>(null);

    const [participantInSpotlight, ...otherParticipants] = participants;

    useEffect(() => {
        if (!participantsBar || !call) return;
        const cleanup = call.dynascaleManager.setViewport(participantsBar);
        return () => cleanup();
    }, [participantsBar, call]);

    return (
        <div className="w-full h-full relative overflow-hidden">
            <div className="h-3/4 bg-[#2C2C2C] rounded-lg overflow-hidden mb-2">
                {call && participantInSpotlight && <ParticipantView participant={participantInSpotlight} />}
            </div>
            {call && otherParticipants.length > 0 && (
                <div className="h-1/4" ref={setParticipantsBar}>
                    <div className="flex overflow-x-auto gap-2 h-full">
                        {otherParticipants.map((participant) => (
                            <div key={participant.sessionId} className="flex-shrink-0 aspect-video bg-[#2C2C2C] rounded-lg overflow-hidden relative">
                                <ParticipantView participant={participant} />
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded-full">
                                    {participant.name || participant.userId}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeakerLayout;
