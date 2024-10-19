import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export const useBasename = () => {
    const [basename, setBasename] = useState<string | null>(null);
    const { user } = usePrivy();

    useEffect(() => {
        const checkBasename = async () => {
            if (user?.wallet?.address) {
                try {
                    // Replace this with the actual API call to check for a basename
                    const response = await fetch(`https://api.basename.com/check/${user.wallet.address}`);
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
    }, [user?.wallet?.address]);

    return basename;
};
