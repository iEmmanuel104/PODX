// Import necessary dependencies from viem, wagmi, and Zora SDK
import { createPublicClient, http, Chain } from 'viem';
import { base } from 'viem/chains';
import { createCreatorClient, createCollectorClient } from "@zoralabs/protocol-sdk";
import { usePrivyWallet } from './usePrivyWallet';

// Declare global type for window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Create a public client for interacting with the blockchain
const publicClient = createPublicClient({
    chain: base as Chain,
    transport: http()
});

// Custom hook for NFT configuration
export const useNftConfig = () => {
    const { getAuthenticatedAddress, getWalletClient, isReady } = usePrivyWallet();

    if (!isReady) {
        return null;
    }

    const userAccount = getAuthenticatedAddress();
    const walletClient = getWalletClient();

    const creatorClient = createCreatorClient({ chain: base, publicClient });
    const collectorClient = createCollectorClient({ chain: base, publicClient });

    return {
        chainId: base.id,
        publicClient,
        walletClient,
        userAccount,
        creatorClient,
        collectorClient
    };
};
