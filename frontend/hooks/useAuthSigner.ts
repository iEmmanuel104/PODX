"use client";
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const { user } = usePrivy();

    const initSigner = useCallback(async () => {
        const smartWallet = user?.smartWallet || user?.linkedAccounts.find((account) => account.type === "smart_wallet");
        const walletAddress = smartWallet?.address || user?.wallet?.address;
        if (walletAddress && window.ethereum) {
            try {
                console.log({ useAuthSigner: walletAddress });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const newSigner = provider.getSigner();
                setSigner(newSigner);
                return newSigner;
            } catch (error) {
                console.error('Failed to initialize signer:', error);
                return null;
            }
        }
        return null;
    }, [user]);

    const signMessage = useCallback(async (message: string): Promise<string> => {
        let currentSigner = signer;
        if (!currentSigner) {
            currentSigner = await initSigner();
        }
        if (!currentSigner) {
            throw new Error('Signer not initialized');
        }
        return await currentSigner.signMessage(message);
    }, [signer, initSigner]);

    return { signer, signMessage, initSigner };
};