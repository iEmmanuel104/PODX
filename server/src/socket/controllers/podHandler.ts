import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { generateRoomId } from '../socket-helper/generateRoomId';
import { logger } from '../../utils/logger';
// import { ethers } from 'ethers';
// import PodXABI from '../../../web3/PodX.json';

// You'll need to set these up in your environment or configuration
// const PODX_CONTRACT_ADDRESS = process.env.PODX_CONTRACT_ADDRESS || '';
// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || '';

// const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
// const podXContract = new ethers.Contract(PODX_CONTRACT_ADDRESS, PodXABI.abi, provider);

export default function attachPodHandlers(io: Server, socket: AuthenticatedSocket) {
    const userId = socket.userId;
    // const userWallet = socket.user.walletAddress;

    socket.on('create-pod', async (ipfsContentHash: string, callback: (response: { success: boolean; podId?: string; error?: string }) => void) => {
        try {
            const podId = generateRoomId();
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.createPodcast(ethers.encodeBytes32String(podId), ipfsContentHash);
            // await tx.wait();

            socket.join(podId);
            callback({ success: true, podId });
            logger.info(`User ${userId} created pod ${podId} on-chain`);
        } catch (error) {
            logger.error(`Error creating pod: ${error}`);
            callback({ success: false, error: 'Failed to create pod on-chain' });
        }
    });

    socket.on('join-pod', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.joinPodcast(ethers.encodeBytes32String(podId));
            // await tx.wait();

            socket.join(podId);
            socket.to(podId).emit('user-joined', { userId, socketId: socket.id });
            callback({ success: true });
            logger.info(`User ${userId} joined pod ${podId} on-chain`);
        } catch (error) {
            logger.error(`Error joining pod: ${error}`);
            callback({ success: false, error: 'Failed to join pod on-chain' });
        }
    });

    socket.on('leave-pod', async (podId: string) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.leavePodcast(ethers.encodeBytes32String(podId));
            // await tx.wait();

            socket.leave(podId);
            socket.to(podId).emit('user-left', { userId, socketId: socket.id });
            logger.info(`User ${userId} left pod ${podId} on-chain`);
        } catch (error) {
            logger.error(`Error leaving pod: ${error}`);
        }
    });

    socket.on('request-co-host', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.requestCoHost(ethers.encodeBytes32String(podId));
            // await tx.wait();

            callback({ success: true });
            logger.info(`User ${userId} requested co-host for pod ${podId}`);
        } catch (error) {
            logger.error(`Error requesting co-host: ${error}`);
            callback({ success: false, error: 'Failed to request co-host on-chain' });
        }
    });

    socket.on('approve-co-host', async (podId: string, coHostAddress: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.approveCoHost(ethers.encodeBytes32String(podId), coHostAddress);
            // await tx.wait();

            callback({ success: true });
            logger.info(`User ${userId} approved co-host ${coHostAddress} for pod ${podId}`);
        } catch (error) {
            logger.error(`Error approving co-host: ${error}`);
            callback({ success: false, error: 'Failed to approve co-host on-chain' });
        }
    });

    socket.on('send-tip', async (podId: string, recipientAddress: string, amount: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.sendTip(ethers.encodeBytes32String(podId), recipientAddress, amount);
            // await tx.wait();

            callback({ success: true });
            logger.info(`User ${userId} sent tip to ${recipientAddress} in pod ${podId}`);
        } catch (error) {
            logger.error(`Error sending tip: ${error}`);
            callback({ success: false, error: 'Failed to send tip on-chain' });
        }
    });

    socket.on('update-content', async (podId: string, newIpfsContentHash: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            // const signer = await provider.getSigner(userWallet);
            // const connectedContract = podXContract.connect(signer);

            // const tx = await connectedContract.updatePodcastContent(ethers.encodeBytes32String(podId), newIpfsContentHash);
            // await tx.wait();

            callback({ success: true });
            logger.info(`User ${userId} updated content for pod ${podId}`);
        } catch (error) {
            logger.error(`Error updating content: ${error}`);
            callback({ success: false, error: 'Failed to update content on-chain' });
        }
    });

    // Existing WebRTC and audio/video toggle handlers...
    socket.on('toggle-audio', ({ podId, isAudioEnabled }: { podId: string; isAudioEnabled: boolean }) => {
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-video', ({ podId, isVideoEnabled }: { podId: string; isVideoEnabled: boolean }) => {
        socket.to(podId).emit('user-video-toggle', { userId, isVideoEnabled });
    });

    socket.on('send-message', ({ podId, message }: { podId: string; message: string }) => {
        socket.to(podId).emit('new-message', { userId, message });
    });

    socket.on('signal', ({ to, signal }: { to: string; signal: unknown }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
        logger.info(`User ${userId} sent a signal to ${to}`);
    });
}