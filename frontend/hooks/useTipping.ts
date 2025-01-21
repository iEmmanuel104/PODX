import { useState, useCallback } from 'react';
import {
    StreamVideoParticipant,
    useCall,
    useConnectedUser,
    CustomVideoEvent,
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
            if (!isAddress(recipient)) throw new Error('Invalid recipient address');
            const parsedAmount = parseEther(amount);

            if (sendTransactionWagmi) {
                await sendTransactionWagmi({
                    to: recipient as `0x${string}`,
                    value: parsedAmount,
                });
                toast.success('tip successful', { id: notification });
            } else {
                throw new Error(
                    "Transaction cannot be sent. Make sure you're connected to a wallet."
                );
            }
        } catch (error) {
            console.error('Error sending ETH:', error);
            toast.error('Failed to send tip. Please try again.', { id: notification });
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
        if (state.selectedTipRecipient && state.tipAmount) {
            try {
                const recipientAddress =
                    (state.selectedTipRecipient?.custom?.fields?.walletAddress?.kind as any)
                        .stringValue || '0xaa';
                await sendETH(recipientAddress, state.tipAmount);
                await sendTipEvent(state.selectedTipRecipient.userId, state.tipAmount);
                setState(prev => ({ ...prev, showTipModal: false }));
            } catch (error) {
                console.error('Error sending tip:', error);
                toast.error('Failed to send tip. Please try again.');
            }
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
