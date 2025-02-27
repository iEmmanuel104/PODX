import { useState, useCallback, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

const clapSound = new Audio('/sounds/clap-sound.mp3');
clapSound.preload = 'auto';

export const useApplaud = (participantId: string) => {
    const [isApplauding, setIsApplauding] = useState(false);
    const call = useCall();

    const handleApplaud = useCallback(() => {
        setIsApplauding(true);
        clapSound.play().catch(console.error);

        // Broadcast event with type 'applaud'
        call?.sendCustomEvent({
            type: 'applaud',
            data: {
                participantId,
                timestamp: Date.now(),
            },
        });

        setTimeout(() => setIsApplauding(false), 3000);
    }, [call, participantId]);

    return { isApplauding, handleApplaud };
};
