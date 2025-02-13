import { useState, useCallback } from 'react';
import {
    StreamVideoParticipant,
    CustomVideoEvent,
    OwnUserResponse,
    Call,
} from '@stream-io/video-react-sdk';
import { useSendTransaction } from '@privy-io/react-auth';
import { useSendTransaction as useSendTransactionWagmi } from 'wagmi';
import { isAddress, parseEther } from 'ethers';
import toast from 'react-hot-toast';

interface TippingState {
    showTipModal: boolean;
    tipAmount: string;
    showTipSuccess: boolean;
    selectedTipRecipient: StreamVideoParticipant | null;
    receivedTips: Array<{ from: string; amount: string }>;
}

export const useTipping = (isEmbeddedWallet: boolean, connectedUser: OwnUserResponse | undefined, call: Call | undefined  ) => {
    const [state, setState] = useState<TippingState>({
        showTipModal: false,
        tipAmount: '',
        showTipSuccess: false,
        selectedTipRecipient: null,
        receivedTips: [],
    });

    // Embedded wallet transaction handling
    const { sendTransaction: sendTransactionEmbedded } = useSendTransaction({
        onError: error => {
            console.error('Embedded wallet transaction failed:', error);
        },
        onSuccess: response => {
            console.log('Embedded wallet transaction successful:', response);
            if (state.selectedTipRecipient) {
                toast.success(
                    `You successfully tipped ${state.selectedTipRecipient.name || state.selectedTipRecipient.userId} ${state.tipAmount} ETH`,
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

    const sendETHEmbedded = async (recipient: string, amount: string) => {
        const notification = toast.loading('Sending tip...');
        try {
            if (!isAddress(recipient)) throw new Error('Invalid recipient address');
            const parsedAmount = parseEther(amount.toString());

            await sendTransactionEmbedded({
                chainId: 8453,
                to: recipient,
                value: parsedAmount,
                gasLimit: 21000,
            });
            toast.success('tip successful', { id: notification });
        } catch (error) {
            console.error('Error sending ETH:', error);
            toast.error('Failed to send tip. Please try again.', { id: notification });
        }
    };

    const sendETH = async (recipient: string, amount: string) => {
        if (isEmbeddedWallet) {
            await sendETHEmbedded(recipient, amount);
        } else {
            await sendETHExternal(recipient, amount);
        }
    };

    const sendTipEvent = useCallback(
        async (recipient: string, amount: string) => {
            if (!call) return;

            await call.sendCustomEvent({
                type: 'tip',
                from: connectedUser?.id || 'Unknown',
                to: recipient,
                amount: amount,
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
            const recipientAddress = state.selectedTipRecipient?.custom?.fields?.walletAddress?.kind;
            const walletAddress = typeof recipientAddress === 'object' && 
                'stringValue' in recipientAddress ? 
                recipientAddress.stringValue : null;

            if (!walletAddress || !isAddress(walletAddress)) {
                toast.error('Invalid recipient wallet address');
                return;
            }

            await sendETH(walletAddress, state.tipAmount);
            await sendTipEvent(state.selectedTipRecipient.userId, state.tipAmount);
            
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
                const { from, to, amount } = event.custom;
                if (to === connectedUser?.id) {
                    setState(prev => ({
                        ...prev,
                        receivedTips: [...prev.receivedTips, { from, amount }],
                    }));
                }
            }
        },
        [connectedUser?.id]
    );

    const openTipModal = (participant: StreamVideoParticipant) => {
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
