import { useState, useEffect } from 'react';
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

export const useDebounceSpeak = (isSpeaking: boolean, delay: number = 550) => {
    const [debouncedSpeaking, setDebouncedSpeaking] = useState(false);

    useEffect(() => {
        if (isSpeaking) {
            setDebouncedSpeaking(true);
            return;
        }
        const timer = setTimeout(() => setDebouncedSpeaking(false), delay);
        return () => clearTimeout(timer);
    }, [isSpeaking, delay]);

    return debouncedSpeaking;
};

export const useParticipantAvatar = (userId: string) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!userId.startsWith('0x')) return;
            try {
                const basename = await getBasename(userId as `0x${string}`);
                if (basename) {
                    const avatar = await getBasenameAvatar(basename);
                    setAvatarUrl(avatar);
                }
            } catch (error) {
                console.error('Error fetching avatar:', error);
            }
        };

        fetchAvatar();
    }, [userId]);

    return avatarUrl;
};

export const truncateUsername = async (name: string, userId: string, isMobile: boolean) => {
    if (userId.startsWith('0x')) {
        try {
            const basename = await getBasename(userId as `0x${string}`);
            if (basename) {
                return isMobile && basename.length > 12 
                    ? `${basename.slice(0, 12)}...` 
                    : basename;
            }
        } catch (error) {
            console.error('Error fetching basename:', error);
        }
        return `${userId.slice(0, 5)}...${userId.slice(-5)}`;
    }
    return isMobile
        ? name.length > 8 ? `${name.slice(0, 3)}...${name.slice(-5)}` : name
        : name.length > 12 ? `${name.slice(0, 12)}...` : name;
}; 