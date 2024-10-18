"use client";
import { useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export const useAuthSigner = () => {
    const { user, signMessage: privySignMessage } = usePrivy();
    const { wallets } = useWallets();

    const initSigner = useCallback(async () => {
        if (user?.wallet?.address) {
            const wallet = wallets.find(w => w.address === user.wallet?.address);
            if (wallet) {
                return wallet;
            }
        }
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

        try {
            if (wallet.walletClientType === 'privy') {
                console.log('Signing with embedded Privy wallet');
                return await privySignMessage(message);
            } else {
                console.log('Signing with non-embedded wallet');
                const provider = await wallet.getEthereumProvider();
                const signature = await provider.request({
                    method: 'personal_sign',
                    params: [message, wallet.address]
                });
                return signature;
            }
        } catch (error) {
            console.error('Error signing message:', error);
            throw new Error('Failed to sign message');
        }
    }, [user, privySignMessage, initSigner]);

    const getAddress = useCallback(async (): Promise<string> => {
        const wallet = await initSigner();
        if (!wallet) {
            throw new Error('Signer not initialized');
        }
        return wallet.address;
    }, [initSigner]);

    return { signMessage, initSigner, getAddress };
};
