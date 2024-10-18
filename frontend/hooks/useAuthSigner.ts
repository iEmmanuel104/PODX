"use client";
import { useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const { user, signMessage: privySignMessage } = usePrivy();
    const { wallets } = useWallets();

    const initSigner = useCallback(async () => {
        console.log('Initializing signer...');
        console.log('User:', user);
        console.log('Wallets:', wallets);

        if (user?.wallet?.address) {
            const wallet = wallets.find(w => w.address === user.wallet?.address);
            if (wallet) {
                console.log('Found matching wallet:', wallet);
                return wallet;
            }
        }

        if (wallets.length > 0) {
            console.log('Using first available wallet:', wallets[0]);
            return wallets[0];
        }

        console.log('No wallet found');
        return null;
    }, [user, wallets]);

    const signMessage = useCallback(async (message: string): Promise<string> => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        const wallet = await initSigner();
        if (!wallet) {
            throw new Error('No wallet found');
        }

        console.log('Wallet:', wallet);

        if (wallet.walletClientType === 'privy') {
            console.log('Signing with embedded wallet (Privy)');
            try {
                return await privySignMessage(message);
            } catch (error) {
                console.error('Error signing message:', error);
                throw new Error('Failed to sign message with Privy wallet');
            }
        } else {
            console.log('Non-embedded wallet detected, not signing');
            return 'NON_EMBEDDED_WALLET';
        }
    }, [user, privySignMessage, initSigner]);

    const getAddress = useCallback(async (): Promise<string> => {
        const wallet = await initSigner();
        if (!wallet) {
            throw new Error('No wallet found');
        }
        return wallet.address;
    }, [initSigner]);

    return { signMessage, initSigner, getAddress };
};
