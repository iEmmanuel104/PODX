/* eslint-disable no-unused-vars */
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { logger } from '../../utils/logger';
import { ethers, TransactionReceipt } from 'ethers';
import { getPodXContractInstance, getSignerForAddress } from '../socket-helper/contractInstance';
import { PodXContract } from '../socket-helper/interface';

export default function attachTipHandlers(io: Server, socket: AuthenticatedSocket) {
    const userId = socket.userId;
    const userWallet = socket.user.walletAddress;

    socket.on('send-tip', async (podId: string, recipientId: string, amount: string, callback: (response: { success: boolean; transactionHash?: string; error?: string }) => void) => {
        try {
            const signer = await getSignerForAddress(userWallet);
            const connectedContract = getPodXContractInstance(signer) as PodXContract;

            // Convert amount to wei (assuming the contract expects wei)
            const amountInWei = ethers.parseEther(amount);

            // Send the transaction
            const tx = await connectedContract.sendTip(ethers.encodeBytes32String(podId), recipientId, amountInWei);

            // Notify the client that the transaction is pending
            socket.emit('tip-pending', { transactionHash: tx.hash });

            // Wait for the transaction to be mined
            const receipt = await tx.wait() as TransactionReceipt;

            if (receipt.status === 1) { // 1 indicates success
                // Check if the TipSent event was emitted
                const tipSentEvent = receipt.logs.find(
                    (log: ethers.Log) => log.topics[0] === ethers.id('TipSent(bytes32,address,address,uint256)')
                );

                if (tipSentEvent) {
                    const decodedEvent = connectedContract.interface.parseLog({
                        topics: tipSentEvent.topics as string[],
                        data: tipSentEvent.data,
                    });
                    logger.info(`Tip sent successfully. Event data: ${JSON.stringify(decodedEvent)}`);

                    // Notify all clients in the pod about the successful tip
                    io.to(podId).emit('tip-sent', {
                        from: userId,
                        to: recipientId,
                        amount: amount,
                        transactionHash: tx.hash,
                    });

                    callback({ success: true, transactionHash: tx.hash });
                } else {
                    logger.warn(`Transaction successful but TipSent event not found. TX Hash: ${tx.hash}`);
                    callback({ success: true, transactionHash: tx.hash });
                }
            } else {
                throw new Error('Transaction failed');
            }

            logger.info(`User ${userId} sent tip of ${amount} to ${recipientId} in pod ${podId}. TX Hash: ${tx.hash}`);
        } catch (error) {
            logger.error(`Error sending tip: ${error}`);
            callback({ success: false, error: 'Failed to send tip' });

            // Notify the client about the failed transaction
            socket.emit('tip-failed', { error: 'Failed to send tip' });
        }
    });
}