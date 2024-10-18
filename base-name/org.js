import { ethers } from 'ethers';
import { useSessionKeys } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import Moralis from 'moralis';

const SESSION_KEY_DURATION = 6 * 24 * 60 * 60 * 1000; // 6 days in milliseconds
const ORG_WALLET_ADDRESS = process.env.REACT_APP_ORG_WALLET_ADDRESS;
const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

export function useOrgWallet() {
    const [sessionKey, setSessionKey] = useState(null);
    const [expirationTime, setExpirationTime] = useState(0);
    const { createSessionKey, configureSessionKey } = useSessionKeys();
    const [balances, setBalances] = useState({ ETH: '0', USDC: '0' });

    const createAndConfigureSessionKey = useCallback(async () => {
        const newSessionKey = await createSessionKey();
        await configureSessionKey(newSessionKey, {
            permissions: [{
                target: ORG_WALLET_ADDRESS,
                functionName: 'transfer',
                rules: [{
                    operator: 'lte',
                    field: 'value',
                    value: ethers.utils.parseEther('0.1'), // Max 0.1 ETH per transaction
                }],
            }],
            expirationDate: new Date(Date.now() + SESSION_KEY_DURATION),
        });
        return newSessionKey;
    }, [createSessionKey, configureSessionKey]);

    useEffect(() => {
        async function setupSessionKey() {
            if (!sessionKey || Date.now() >= expirationTime) {
                const newSessionKey = await createAndConfigureSessionKey();
                setSessionKey(newSessionKey);
                setExpirationTime(Date.now() + SESSION_KEY_DURATION);
            }
        }
        setupSessionKey();
    }, [sessionKey, expirationTime, createAndConfigureSessionKey]);

    const transferFromOrgWallet = useCallback(async (userAddress, amount) => {
        if (!sessionKey) {
            throw new Error('Session key not available');
        }
        try {
            const transaction = {
                to: userAddress,
                value: ethers.utils.parseEther(amount.toString()),
            };
            const txHash = await sessionKey.sendTransaction(transaction);
            console.log(`Transferred ${amount} ETH to ${userAddress}. Transaction hash: ${txHash}`);
            return txHash;
        } catch (error) {
            console.error('Error transferring from org wallet:', error);
            throw error;
        }
    }, [sessionKey]);

    const checkWalletBalance = useCallback(async (walletAddress) => {
        try {
            await Moralis.start({
                apiKey: MORALIS_API_KEY
            });

            const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
                "chain": "0x2105", // Base chain ID
                "address": walletAddress
            });

            const result = response.raw.result;
            let ethBalance = '0';
            let usdcBalance = '0';

            for (const token of result) {
                if (token.token_address === ETH_ADDRESS) {
                    ethBalance = token.balance_formatted;
                } else if (token.token_address === USDC_ADDRESS) {
                    usdcBalance = token.balance_formatted;
                }
            }

            return { ETH: ethBalance, USDC: usdcBalance };
        } catch (error) {
            console.error('Error checking wallet balance:', error);
            throw error;
        }
    }, []);

    return { transferFromOrgWallet, checkWalletBalance };
}
