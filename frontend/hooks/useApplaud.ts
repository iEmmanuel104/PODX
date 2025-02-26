import { useState, useCallback, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

const clapSound = new Audio('/sounds/clap-sound.mp3');
clapSound.preload = 'auto';

export const useApplaud = (participantId: string) => {
    const [isApplauding, setIsApplauding] = useState(false);
    const call = useCall();

    const handleApplaud = useCallback(() => {
        setIsApplauding(true);
        clapSound.play();

        call?.sendCustomEvent({
            type: 'applaud',
            data: { participantId },
        });

        setTimeout(() => setIsApplauding(false), 3000);
    }, [call, participantId]);

    useEffect(() => {
        if (!call) return;

        const handleCustomEvent = (event: any) => {
            if (event.type === 'applaud' && event.data.participantId === participantId) {
                setIsApplauding(true);
                clapSound.play();
                setTimeout(() => setIsApplauding(false), 3000);
            }
        };

        call.on('custom', handleCustomEvent);
        return () => call.off('custom', handleCustomEvent);
    }, [call, participantId]);

    return { isApplauding, handleApplaud };
};
