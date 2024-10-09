import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const { user } = usePrivy();

    useEffect(() => {
        const initSigner = async () => {
            if (user?.wallet?.address) {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    setSigner(signer);
                } catch (error) {
                    console.error('Failed to initialize signer:', error);
                }
            }
        };

        initSigner();
    }, [user]);

    const signMessage = async (message: string): Promise<string> => {
        if (!signer) {
            throw new Error('Signer not initialized');
        }
        return await signer.signMessage(message);
    };

    return { signer, signMessage };
};
