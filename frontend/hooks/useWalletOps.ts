import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export const useWalletOperations = () => {
    const { wallets } = useWallets();
    const { ready, authenticated, user, exportWallet, logout } = usePrivy();
    const activeWalletAddress = wallets[0]?.address;

    const handleWithdraw = async (
        address: string,
        amount: string,
        onSuccess?: (hash: string) => void,
        onError?: (error: Error) => void
    ) => {
        try {
            // Validate inputs
            if (!ethers.isAddress(address)) {
                throw new Error('Invalid destination address');
            }

            if (isNaN(Number(amount)) || Number(amount) <= 0) {
                throw new Error('Invalid amount');
            }

            // Check if user has embedded wallet
            const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');

            if (!embeddedWallet) {
                throw new Error('Embedded wallet not found');
            }

            // Get the provider
            const provider = await embeddedWallet.getEthersProvider();
            const signer = provider.getSigner();

            // Create and send transaction
            const tx = await signer.sendTransaction({
                to: address,
                value: ethers.parseEther(amount),
            });

            // Wait for transaction receipt
            const receipt = await tx.wait();
            onSuccess?.(receipt.transactionHash);
            return receipt.transactionHash;
        } catch (error) {
            console.error('Withdrawal failed:', error);
            onError?.(error as Error);
            throw error;
        }
    };

    const handleExportWallet = async (onSuccess?: () => void, onError?: (error: Error) => void) => {
        try {
            // Check if user is authenticated and has embedded wallet
            const isAuthenticated = ready && authenticated;
            const hasEmbeddedWallet = user?.linkedAccounts?.find(
                account => account.type === 'wallet' && account.walletClientType === 'privy'
            );

            if (!isAuthenticated || !hasEmbeddedWallet) {
                throw new Error('Embedded wallet not available for export');
            }

            await exportWallet();
            onSuccess?.();
        } catch (error) {
            console.error('Export failed:', error);
            onError?.(error as Error);
            throw error;
        }
    };

    const getActiveWalletAddress = () => activeWalletAddress;

    const handleLogout = () => {
        logout();
    };

    // Return authentication status and wallet availability check
    const canExportWallet =
        ready &&
        authenticated &&
        !!user?.linkedAccounts?.find(
            account => account.type === 'wallet' && account.walletClientType === 'privy'
        );

    return {
        handleWithdraw,
        handleExportWallet,
        canExportWallet,
        handleLogout,
        getActiveWalletAddress,
    };
};
