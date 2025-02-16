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
    receivedTips: Array<{ from: string; amount: string, currency: string }>;
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
    });

    const call = useCall();
    const connectedUser = useConnectedUser();

    // Embedded wallet transaction handling
    const { sendTransaction: sendTransactionEmbedded } = useSendTransaction({
        onError: error => {
            console.error('Embedded wallet transaction failed:', error);
        },
        onSuccess: response => {
            console.log('Embedded wallet transaction successful:', response);
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
                toast.error("Wallet not connected properly", { id: notification });
                return;
            }

            const parsedAmount = parseEther(amount);

            // Send the transaction and wait for it to be mined
            const hash = await sendTransactionWagmi({
                to: recipient as `0x${string}`,
                value: parsedAmount,
            });

            console.log({ tipExternal: hash });

            toast.success('Tip sent successfully!', { id: notification });
            return hash;

        } catch (error) {
            console.error('Error sending ETH:', error);
            let errorMessage = 'Failed to send tip. Please try again.';

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

    const sendUSDCExternal = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending USDC tip...');
        try {
            if (!isAddress(recipient)) {
                toast.error('Invalid recipient address', { id: notification });
                return;
            }

            if (!sendTransactionWagmi) {
                toast.error("Wallet not connected properly", { id: notification });
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
                chainId: 8453
            });

            console.log({ tipExternal: hash });

            toast.success('USDC tip sent successfully!', { id: notification });
            return hash;

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

            const tipEmbedded = await sendTransactionEmbedded({
                chainId: 8453,
                to: recipient,
                value: parsedAmount,
                gasLimit: 21000,
            });

            console.log({ tipEmbedded });
            toast.success('tip successful', { id: notification });
        } catch (error) {
            console.error('Error sending ETH:', error);
            toast.error('Failed to send tip. Please try again.', { id: notification });
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

            const tipEmbedded = await sendTransactionEmbedded({
                chainId: 8453,
                to: USDC_CONTRACT_ADDRESS,
                data,
                gasLimit: 100000, // Adjust gas limit for contract interactions
            });

            console.log({ tipEmbedded });
            toast.success('USDC tip successful', { id: notification });
        } catch (error) {
            console.error('Error sending USDC:', error);
            toast.error('Failed to send USDC tip. Please try again.', { id: notification });
        }
    };

    const sendETH = async (recipient: string, amount: string) => {
        if (isEmbeddedWallet) {
            await sendETHEmbedded(recipient, amount);
        } else {
            await sendETHExternal(recipient, amount);
        }
    };

    // mock function to detect if tipping with eth or usdc
    // const sendTip = async (recipient: string, amount: string) => {
    //     if (state.selectedCurrency === 'ETH') {
    //         if (isEmbeddedWallet) {
    //             await sendETHEmbedded(recipient, amount);
    //         } else {
    //             await sendETHExternal(recipient, amount);
    //         }
    //     } else if (state.selectedCurrency === 'USDC') {
    //         if (isEmbeddedWallet) {
    //             await sendUSDCEmbedded(recipient, amount);
    //         } else {
    //             await sendUSDCExternal(recipient, amount);
    //         }
    //     }
    // };

    const sendTipEvent = useCallback(
        async (recipient: MemberResponse, amount: string) => {
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
                transactionHash: null,
                currency: 'ETH',
                timestamp: new Date().toISOString(),
            });
        },
        [call, connectedUser]
    );

    const handleTip = async () => {
        console.log("state.selectedTipRecipient", state.selectedTipRecipient)
        if (!state.selectedTipRecipient) {
            toast.error('No recipient selected');
            return;
        }

        if (!state.tipAmount || isNaN(Number(state.tipAmount)) || Number(state.tipAmount) <= 0) {
            toast.error('Please enter a valid tip amount');
            return;
        }

        try {
            // Safely access the wallet address with proper type checking
            const walletAddress = state.selectedTipRecipient.user.custom?.walletAddress;

            if (!walletAddress || !isAddress(walletAddress)) {
                toast.error('Invalid recipient wallet address');
                return;
            }

            await sendETH(walletAddress, state.tipAmount);
            await sendTipEvent(state.selectedTipRecipient, state.tipAmount);

            // Show success state
            setState(prev => ({
                ...prev,
                showTipModal: false,
                showTipSuccess: true
            }));

            // Hide success message after 5 seconds
            setTimeout(() => {
                setState(prev => ({ ...prev, showTipSuccess: false }));
            }, 5000);

        } catch (error) {
            console.error('Error sending tip:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send tip. Please try again.');
        }
    };

    const handleTipEvent = useCallback(
        (event: CustomVideoEvent) => {
            if (event.custom.type === 'tip') {
                console.log('event.custom', event.custom);
                const { from, to, amount, currency } = event.custom;
                const senderName = from?.name || 'Anon';
                if (to.id === connectedUser?.id) {
                    setState(prev => ({
                        ...prev,
                        receivedTips: [...prev.receivedTips, { from: senderName, amount, currency }],
                    }));
                }
            }
        },
        [connectedUser?.id]
    );

    const openTipModal = (participant: MemberResponse) => {
        console.log("opening tip modal and setting recipient to", { participant })
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
        openTipModal,
        handleTip,
        handleCancelTip,
        setTipAmount,
        handleTipEvent,
    };
};
