import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export const useBasename = ({ walletaddress }: { walletaddress: string }) => {
    const [basename, setBasename] = useState<string | null>(null);
    const { user } = useAppSelector((state) => state.user);

    useEffect(() => {
        const checkBasename = async () => {
            if (walletaddress) {
                try {
                    // Replace this with the actual API call to check for a basename
                    const response = await fetch(`https://api.basename.com/check/${walletaddress}`);
                    const data = await response.json();
                    if (data.basename) {
                        setBasename(data.basename);
                    }
                } catch (error) {
                    console.error('Error checking basename:', error);
                }
            }
        };

        checkBasename();
    }, [walletaddress]);

    return basename;
};
