import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

export const usePrivyWallet = () => {
    const { user, authenticated, ready, login } = usePrivy();
    const { wallets } = useWallets();

    const getAuthenticatedAddress = () => {
        if (!ready || !authenticated || !user || wallets.length === 0) {
            return null;
        }
        return wallets[0].address;
    };

    const getWalletClient = () => {
        if (!ready || !authenticated || !user || wallets.length === 0) {
            return null;
        }
        return createWalletClient({
            chain: base,
            transport: custom(wallets[0].provider)
        });
    };

    const performTransaction = async (transactionConfig) => {
        const walletClient = getWalletClient();
        if (!walletClient) {
            throw new Error("Wallet is not ready or user is not authenticated");
        }
        try {
            const hash = await walletClient.sendTransaction(transactionConfig);
            return hash;
        } catch (error) {
            console.error("Transaction failed:", error);
            throw error;
        }
    };

    const ensureAuthenticated = async () => {
        if (!authenticated) {
            await login();
        }
    };

    return {
        getAuthenticatedAddress,
        getWalletClient,
        performTransaction,
        ensureAuthenticated,
        isReady: ready && authenticated && user && wallets.length > 0
    };
};
