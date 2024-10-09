// src/hooks/useEthersSigner.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useAuthSigner = () => {
    const [signer, setSigner] = useState<ethers.Signer | null>(null);

    useEffect(() => {
        const initSigner = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
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
    }, []);

    const signMessage = async (message: string): Promise<string> => {
        if (!signer) {
            throw new Error('Signer not initialized');
        }
        return await signer.signMessage(message);
    };

    return { signer, signMessage };
};