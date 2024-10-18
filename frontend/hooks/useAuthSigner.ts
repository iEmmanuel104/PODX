"use client";
import { useState, useCallback } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const [signer, setSigner] = useState<any | null>(null);
    const { wallets } = useWallets();
    const { user } = usePrivy();

    console.log({
        walletsfound: wallets,
        userfound: user,
    });

    const initSigner = useCallback(async () => {
        if (wallets.length > 0) {
            try {
                const wallet = wallets[0]; // Get the most recently connected wallet
                const provider = await wallet.getEthereumProvider();
                setSigner(provider);
                return provider;
            } catch (error) {
                console.error('Failed to initialize signer:', error);
                return null;
            }
        }
        return null;
    }, [wallets]);

    const signMessage = useCallback(async (message: string): Promise<string> => {
        let currentSigner = signer;
        if (!currentSigner) {
            currentSigner = await initSigner();
        }
        if (!currentSigner) {
            throw new Error('Signer not initialized');
        }
        const wallet = wallets[0];
        const address = wallet.address;
        return await currentSigner.request({
            method: 'personal_sign',
            params: [message, address],
        });
    }, [signer, initSigner, wallets]);

    return { signer, signMessage, initSigner };
};