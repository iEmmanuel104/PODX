/* eslint-disable no-unused-vars */
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { logger } from '../../utils/logger';
import { PodManager } from '../socket-helper/podManager';
import { PodType, PodMember } from '../socket-helper/interface';
import { ethers } from 'ethers';
import { getPodXContractInstance, getSignerForAddress } from '../socket-helper/contractInstance';
import { IPod } from '../../models/Mongodb/pod.model';

export default function attachPodHandlers(io: Server, socket: AuthenticatedSocket, podManager: PodManager) {
    const userId = socket.userId;
    const userWallet = socket.user.walletAddress;
    const user = socket.user;

    socket.on('create-pod', async (ipfsContentHash: string, callback: (response: { success: boolean; podId?: string; error?: string }) => void) => {
        try {
            const newPod = await podManager.createPod(user, socket.id, ipfsContentHash);

            console.log({ newPod });
            console.log('web3');
            // const signer = await getSignerForAddress(userWallet);
            // const connectedContract = getPodXContractInstance(signer);

            // const tx = await connectedContract.createPodcast(ethers.encodeBytes32String(newPod.id), ipfsContentHash);
            // await tx.wait();
            console.log('web3 end');

            socket.join(newPod.id);
            callback({ success: true, podId: newPod.id });
            logger.info(`User ${userId} created pod ${newPod.id}`);
        } catch (error) {
            logger.error(`Error creating pod: ${error}`);
            callback({ success: false, error: 'Failed to create pod' });
        }
    });

    socket.on('join-pod', async (podId: string, callback: (response: { success: boolean; status?: 'joined' | 'requested'; error?: string }) => void) => {
        try {
            const joinStatus = await podManager.joinPod(podId, user, socket.id);
            if (joinStatus === 'joined') {
                const signer = await getSignerForAddress(userWallet);
                const connectedContract = getPodXContractInstance(signer);

                const tx = await connectedContract.joinPodcast(ethers.encodeBytes32String(podId));
                await tx.wait();

                socket.join(podId);
                const pod = await podManager.getPod(podId);
                if (pod) {
                    socket.to(podId).emit('user-joined', { userId, socketId: socket.id });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                }
                callback({ success: true, status: 'joined' });
                logger.info(`User ${userId} joined pod ${podId}`);
            } else if (joinStatus === 'requested') {
                callback({ success: true, status: 'requested' });
                logger.info(`User ${userId} requested to join pod ${podId}`);
            }
        } catch (error) {
            logger.error(`Error joining pod: ${error}`);
            callback({ success: false, error: 'Failed to join pod' });
        }
    });

    socket.on('leave-pod', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const updatedPod = await podManager.leavePod(podId, userId);
            if (updatedPod) {
                // const signer = await getSignerForAddress(userWallet);
                // const connectedContract = getPodXContractInstance(signer);

                // const tx = await connectedContract.leavePodcast(ethers.encodeBytes32String(podId));
                // await tx.wait();

                socket.leave(podId);
                socket.to(podId).emit('user-left', { userId, socketId: socket.id });
                io.to(podId).emit('pod-stats-updated', updatedPod.stats);
                if (updatedPod.owner.toString() !== userId) {
                    io.to(podId).emit('pod-owner-changed', { podId, newOwnerId: updatedPod.owner.toString() });
                }
                callback({ success: true });
                logger.info(`User ${userId} left pod ${podId}`);
            } else {
                callback({ success: false, error: 'Failed to leave pod' });
            }
        } catch (error) {
            logger.error(`Error leaving pod: ${error}`);
            callback({ success: false, error: 'Failed to leave pod' });
        }
    });

    socket.on('get-pod-info', async (podId: string, callback: (response: { success: boolean; pod?: IPod; error?: string }) => void) => {
        const pod = await podManager.getPod(podId);
        if (pod) {
            callback({ success: true, pod });
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('get-pod-members', async (podId: string, callback: (response: { success: boolean; members?: PodMember[]; error?: string }) => void) => {
        const members = await podManager.getPodMembers(podId);
        if (members) {
            callback({ success: true, members });
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('get-join-requests', async (podId: string, callback: (response: { success: boolean; requests?: string[]; error?: string }) => void) => {
        try {
            const joinRequests = await podManager.getJoinRequests(podId);
            callback({ success: true, requests: joinRequests });
            logger.info(`User ${userId} fetched join requests for pod ${podId}`);
        } catch (error) {
            logger.error(`Error fetching join requests: ${error}`);
            callback({ success: false, error: 'Failed to fetch join requests' });
        }
    });

    socket.on('get-co-host-requests', async (podId: string, callback: (response: { success: boolean; requests?: string[]; error?: string }) => void) => {
        try {
            const coHostRequests = await podManager.getCoHostRequests(podId);
            callback({ success: true, requests: coHostRequests });
            logger.info(`User ${userId} fetched co-host requests for pod ${podId}`);
        } catch (error) {
            logger.error(`Error fetching co-host requests: ${error}`);
            callback({ success: false, error: 'Failed to fetch co-host requests' });
        }
    });

    socket.on('update-content', async (podId: string, newIpfsContentHash: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const pod = await podManager.getPod(podId);
            if (pod && (pod.owner.toString() === userId || pod.hosts.some(hostId => hostId.toString() === userId))) {
                const signer = await getSignerForAddress(userWallet);
                const connectedContract = getPodXContractInstance(signer);

                const tx = await connectedContract.updatePodcastContent(ethers.encodeBytes32String(podId), newIpfsContentHash);
                await tx.wait();

                const success = await podManager.updatePodContent(podId, newIpfsContentHash);
                if (success) {
                    io.to(podId).emit('content-updated', { podId, newIpfsContentHash });
                    callback({ success: true });
                    logger.info(`User ${userId} updated content for pod ${podId}`);
                } else {
                    callback({ success: false, error: 'Failed to update content' });
                }
            } else {
                callback({ success: false, error: 'Unauthorized' });
            }
        } catch (error) {
            logger.error(`Error updating content: ${error}`);
            callback({ success: false, error: 'Failed to update content' });
        }
    });

    socket.on('request-co-host', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.requestCoHost(podId, userId);
            if (success) {
                const signer = await getSignerForAddress(userWallet);
                const connectedContract = getPodXContractInstance(signer);

                const tx = await connectedContract.requestCoHost(ethers.encodeBytes32String(podId));
                await tx.wait();

                const pod = await podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('co-host-requested', { userId, podId });
                    callback({ success: true });
                    logger.info(`User ${userId} requested co-host for pod ${podId}`);
                } else {
                    callback({ success: false, error: 'Pod not found' });
                }
            } else {
                callback({ success: false, error: 'Failed to request co-host' });
            }
        } catch (error) {
            logger.error(`Error requesting co-host: ${error}`);
            callback({ success: false, error: 'Failed to request co-host' });
        }
    });

    socket.on('approve-co-host', async (podId: string, coHostUserId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.approveCoHost(podId, coHostUserId);
            if (success) {
                const signer = await getSignerForAddress(userWallet);
                const connectedContract = getPodXContractInstance(signer);

                const tx = await connectedContract.approveCoHost(ethers.encodeBytes32String(podId), coHostUserId);
                await tx.wait();

                const pod = await podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('co-host-approved', { approvedUserId: coHostUserId, podId });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true });
                    logger.info(`User ${userId} approved co-host ${coHostUserId} for pod ${podId}`);
                } else {
                    callback({ success: false, error: 'Pod not found' });
                }
            } else {
                callback({ success: false, error: 'Failed to approve co-host' });
            }
        } catch (error) {
            logger.error(`Error approving co-host: ${error}`);
            callback({ success: false, error: 'Failed to approve co-host' });
        }
    });

    socket.on('change-pod-type', async (podId: string, newType: PodType, callback: (response: { success: boolean; admittedUsers?: string[]; error?: string }) => void) => {
        try {
            const admittedUsers = await podManager.changePodType(podId, newType);
            const pod = await podManager.getPod(podId);
            if (pod) {
                io.to(podId).emit('pod-type-changed', { podId, newType });
                if (newType === 'open' && admittedUsers.length > 0) {
                    io.to(podId).emit('users-admitted', { podId, admittedUsers });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                }
                callback({ success: true, admittedUsers });
                logger.info(`User ${userId} changed pod ${podId} type to ${newType}`);
            } else {
                callback({ success: false, error: 'Pod not found' });
            }
        } catch (error) {
            logger.error(`Error changing pod type: ${error}`);
            callback({ success: false, error: 'Failed to change pod type' });
        }
    });

    socket.on('approve-join-request', async (podId: string, joinUserId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.approveJoinRequest(podId, joinUserId);
            if (success) {
                const pod = await podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('join-request-approved', { approvedUserId: joinUserId, podId });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true });
                    logger.info(`User ${userId} approved join request for ${joinUserId} in pod ${podId}`);
                } else {
                    callback({ success: false, error: 'Pod not found' });
                }
            } else {
                callback({ success: false, error: 'Failed to approve join request' });
            }
        } catch (error) {
            logger.error(`Error approving join request: ${error}`);
            callback({ success: false, error: 'Failed to approve join request' });
        }
    });

    socket.on('approve-all-join-requests', async (podId: string, callback: (response: { success: boolean; approvedUsers?: string[]; error?: string }) => void) => {
        try {
            const approvedUsers = await podManager.approveAllJoinRequests(podId);
            if (approvedUsers.length > 0) {
                const pod = await podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('all-join-requests-approved', { podId, approvedUsers });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true, approvedUsers });
                    logger.info(`User ${socket.userId} approved all join requests for pod ${podId}`);
                } else {
                    callback({ success: false, error: 'Pod not found' });
                }
            } else {
                callback({ success: true, approvedUsers: [] });
                logger.info(`No join requests to approve for pod ${podId}`);
            }
        } catch (error) {
            logger.error(`Error approving all join requests: ${error}`);
            callback({ success: false, error: 'Failed to approve all join requests' });
        }
    });

    socket.on('update-local-tracks', async (podId: string, audioTrackId: string | null, videoTrackId: string | null, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.updateLocalTracks(podId, userId, audioTrackId, videoTrackId);
            if (success) {
                callback({ success: true });
                logger.info(`User ${userId} updated local tracks for pod ${podId}`);
            } else {
                callback({ success: false, error: 'Failed to update local tracks' });
            }
        } catch (error) {
            logger.error(`Error updating local tracks: ${error}`);
            callback({ success: false, error: 'Failed to update local tracks' });
        }
    });

    socket.on('toggle-screen-sharing', async (podId: string, isScreenSharing: boolean, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.toggleScreenSharing(podId, userId, isScreenSharing);
            if (success) {
                io.to(podId).emit('screen-sharing-toggled', { podId, userId, isScreenSharing });
                callback({ success: true });
                logger.info(`User ${userId} ${isScreenSharing ? 'started' : 'stopped'} screen sharing in pod ${podId}`);
            } else {
                callback({ success: false, error: 'Failed to toggle screen sharing' });
            }
        } catch (error) {
            logger.error(`Error toggling screen sharing: ${error}`);
            callback({ success: false, error: 'Failed to toggle screen sharing' });
        }
    });

    socket.on('send-message', ({ podId, message }: { podId: string; message: string }) => {
        socket.to(podId).emit('new-message', { userId, message });
    });

    socket.on('signal', ({ to, signal }: { to: string; signal: unknown }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
        logger.info(`User ${userId} sent a signal to ${to}`);
    });
}