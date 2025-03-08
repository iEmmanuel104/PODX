import { useState, useCallback } from 'react';
import {
    MemberResponse,
    CustomVideoEvent,
    useCall,
    useConnectedUser,
} from '@stream-io/video-react-sdk';
import { useSendTransaction } from '@privy-io/react-auth';
import { useSendTransaction as useSendTransactionWagmi } from 'wagmi';
import { ethers, isAddress, parseEther, parseUnits } from 'ethers';
import { erc20Abi } from 'viem';
import toast from 'react-hot-toast';

interface TippingState {
    showTipModal: boolean;
    tipAmount: string;
    showTipSuccess: boolean;
    selectedTipRecipient: MemberResponse | null;
    receivedTips: Array<{ from: string; amount: string; currency: string }>;
    selectedCurrency: 'ETH' | 'USDC';
}

// USDC contract address (example for Base chain)
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Replace with actual USDC contract address
export const USDC_DECIMALS = 6;

export const useTipping = (isEmbeddedWallet: boolean) => {
    const [state, setState] = useState<TippingState>({
        showTipModal: false,
        tipAmount: '',
        showTipSuccess: false,
        selectedTipRecipient: null,
        receivedTips: [],
        selectedCurrency: 'ETH',
    });

    const call = useCall();
    const connectedUser = useConnectedUser();

    // Embedded wallet transaction handling
    const { sendTransaction: sendTransactionEmbedded } = useSendTransaction({
        onError: error => {
            console.error('Embedded wallet transaction failed:', error);
        },
        onSuccess: response => {
            console.debug('Embedded wallet transaction successful:', response);
            if (state.selectedTipRecipient) {
                toast.success(
                    `You successfully tipped ${state.selectedTipRecipient.user.name || state.selectedTipRecipient.user.id} ${state.tipAmount} ETH`,
                    { duration: 5000 }
                );
            }
        },
    });

    // External wallet transaction handling
    const { sendTransactionAsync: sendTransactionWagmi } = useSendTransactionWagmi();

    const sendETHExternal = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending tip...');
        try {
            if (!isAddress(recipient)) {
                toast.error('Invalid recipient address', { id: notification });
                return;
            }

            if (!sendTransactionWagmi) {
                toast.error('Wallet not connected properly', { id: notification });
                return;
            }

            const parsedAmount = parseEther(amount);

            // Send the transaction and wait for it to be mined
            const hash = await sendTransactionWagmi({
                to: recipient as `0x${string}`,
                value: parsedAmount,
            });

            console.debug({ tipExternal: hash });
            toast.success('Tip sent successfully!', { id: notification });

            return { hash }; // Return transaction hash
        } catch (error) {
            console.error('Error sending ETH:', error);
            let errorMessage = 'Failed to send tip. Please try again.';

            if (error instanceof Error) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds to send tip';
                } else if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction was rejected';
                }
            }

            toast.error(errorMessage, { id: notification });
            throw error;
        }
    };

    const sendUSDCExternal = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending USDC tip...');
        try {
            if (!isAddress(recipient)) {
                toast.error('Invalid recipient address', { id: notification });
                return;
            }

            if (!sendTransactionWagmi) {
                toast.error('Wallet not connected properly', { id: notification });
                return;
            }

            const parsedAmount = parseUnits(amount, USDC_DECIMALS); // Parse USDC amount with 6 decimals

            // Encode the USDC transfer function call
            const data = new ethers.Interface(erc20Abi).encodeFunctionData('transfer', [
                recipient,
                parsedAmount,
            ]);

            // Send the transaction
            const hash = await sendTransactionWagmi({
                to: USDC_CONTRACT_ADDRESS as `0x${string}`,
                data: data as `0x${string}`,
                chainId: 8453,
            });

            toast.success('USDC tip sent successfully!', { id: notification });
            return { hash };
        } catch (error) {
            console.error('Error sending USDC:', error);
            let errorMessage = 'Failed to send USDC tip. Please try again.';

            if (error instanceof Error) {
                // Handle specific error cases
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds to send tip';
                } else if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction was rejected';
                }
            }

            toast.error(errorMessage, { id: notification });
            throw error; // Re-throw to be caught by handleTip
        }
    };

    const sendETHEmbedded = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending tip...');
        try {
            if (!isAddress(recipient)) throw new Error('Invalid recipient address');
            const parsedAmount = parseEther(amount.toString());

            const response = await sendTransactionEmbedded({
                chainId: 8453,
                to: recipient,
                value: parsedAmount,
                gasLimit: 21000,
            });

            toast.success('tip successful', { id: notification });
            return { hash: response.transactionHash };
        } catch (error) {
            console.error('Error sending ETH:', error);
            toast.error('Failed to send tip. Please try again.', { id: notification });
            throw Error(error as string);
        }
    };

    const sendUSDCEmbedded = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending USDC tip...');
        try {
            if (!isAddress(recipient)) throw new Error('Invalid recipient address');
            const parsedAmount = parseUnits(amount, USDC_DECIMALS); // Parse USDC amount with 6 decimals

            // Encode the USDC transfer function call
            const data = new ethers.Interface(erc20Abi).encodeFunctionData('transfer', [
                recipient,
                parsedAmount,
            ]);

            const response = await sendTransactionEmbedded({
                chainId: 8453,
                to: USDC_CONTRACT_ADDRESS,
                data,
                gasLimit: 100000,
            });

            toast.success('USDC tip successful', { id: notification });
            return { hash: response.transactionHash };
        } catch (error) {
            console.error('Error sending USDC:', error);
            toast.error('Failed to send USDC tip. Please try again.', { id: notification });
        }
    };

    const sendTip = async (recipient: string, amount: string): Promise<string> => {
        let transactionHash = '';

        if (state.selectedCurrency === 'ETH') {
            if (isEmbeddedWallet) {
                const response = await sendETHEmbedded(recipient, amount);
                transactionHash = response?.hash || '';
            } else {
                const response = await sendETHExternal(recipient, amount);
                transactionHash = response?.hash || '';
            }
        } else if (state.selectedCurrency === 'USDC') {
            if (isEmbeddedWallet) {
                const response = await sendUSDCEmbedded(recipient, amount);
                transactionHash = response?.hash || '';
            } else {
                const response = await sendUSDCExternal(recipient, amount);
                transactionHash = response?.hash || '';
            }
        }

        return transactionHash;
    };

    const sendTipEvent = useCallback(
        async (recipient: MemberResponse, amount: string, transactionHash: string) => {
            if (!call) return;

            await call.sendCustomEvent({
                type: 'tip',
                from: {
                    id: connectedUser?.id || 'Unknown',
                    name: connectedUser?.name || 'Anon',
                },
                to: {
                    id: recipient.user.id,
                    name: recipient.user.name,
                },
                amount: amount,
                transactionHash,
                currency: state.selectedCurrency,
                timestamp: new Date().toISOString(),
            });
        },
        [call, connectedUser, state.selectedCurrency]
    );

    const handleTip = async () => {
        if (!state.selectedTipRecipient) {
            toast.error('No recipient selected');
            return;
        }

        if (!state.tipAmount || isNaN(Number(state.tipAmount)) || Number(state.tipAmount) <= 0) {
            toast.error('Please enter a valid tip amount');
            return;
        }

        try {
            const walletAddress = state.selectedTipRecipient.user.custom?.walletAddress;

            if (!walletAddress || !isAddress(walletAddress)) {
                toast.error('Invalid recipient wallet address');
                return;
            }

            // Get transaction hash from sendTip
            const transactionHash = await sendTip(walletAddress, state.tipAmount);

            setState(prev => ({
                ...prev,
                showTipModal: false,
                showTipSuccess: true,
            }));

            // Send tip event with transaction hash
            await sendTipEvent(state.selectedTipRecipient, state.tipAmount, transactionHash);

            setTimeout(() => {
                setState(prev => ({ ...prev, showTipSuccess: false }));
            }, 5000);
        } catch (error) {
            console.error('Error sending tip:', error);
        }
    };

    const setCurrency = (currency: 'ETH' | 'USDC') => {
        setState(prev => ({ ...prev, selectedCurrency: currency }));
    };

    const handleTipEvent = useCallback(
        (event: CustomVideoEvent) => {
            if (event.custom.type === 'tip') {
                console.debug('event.custom', event.custom);
                const { from, to, amount, currency } = event.custom;
                const senderName = from?.name || 'Anon';
                if (to.id === connectedUser?.id) {
                    setState(prev => ({
                        ...prev,
                        receivedTips: [
                            ...prev.receivedTips,
                            { from: senderName, amount, currency },
                        ],
                    }));
                }
            }
        },
        [connectedUser?.id]
    );

    const openTipModal = (participant: MemberResponse) => {
        console.debug('opening tip modal and setting recipient to', { participant });
        setState(prev => ({
            ...prev,
            selectedTipRecipient: participant,
            showTipModal: true,
        }));
    };

    const handleCancelTip = () => {
        setState(prev => ({
            ...prev,
            showTipModal: false,
            tipAmount: '',
            selectedTipRecipient: null,
        }));
    };

    const setTipAmount = (amount: string) => {
        setState(prev => ({ ...prev, tipAmount: amount }));
    };

    return {
        ...state,
        setState,
        openTipModal,
        handleTip,
        handleCancelTip,
        setTipAmount,
        setCurrency,
        handleTipEvent,
    };
};
