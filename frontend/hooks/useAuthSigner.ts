"use client";
import { useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const { user } = usePrivy();
    const { wallets } = useWallets();

    const initSigner = useCallback(async () => {
        if (user?.wallet?.address) {
            const wallet = wallets.find(w => w.address === user.wallet.address);
            if (wallet) {
                return wallet;
            }
        }
        return null;
    }, [user, wallets]);

    const signMessage = useCallback(async (message: string): Promise<string> => {
        const wallet = await initSigner();
        if (!wallet) {
            throw new Error('Signer not initialized');
        }
        return await wallet.signMessage(message);
    }, [initSigner]);

    const getAddress = useCallback(async (): Promise<string> => {
        const wallet = await initSigner();
        if (!wallet) {
            throw new Error('Signer not initialized');
        }
        return wallet.address;
    }, [initSigner]);

    return { signMessage, getAddress };
};
