import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { PodManager } from '../socket-helper/podManager';
import { logger } from '../../utils/logger';

export default function attachMediaToggleHandlers(io: Server, socket: AuthenticatedSocket, podManager: PodManager) {
    const userId = socket.userId;

    socket.on('toggle-audio', async ({ podId, isAudioEnabled }: { podId: string; isAudioEnabled: boolean }) => {
        await podManager.updateUserInfo(podId, userId, { isAudioEnabled });
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-video', async ({ podId, isVideoEnabled }: { podId: string; isVideoEnabled: boolean }) => {
        await podManager.updateUserInfo(podId, userId, { isVideoEnabled });
        socket.to(podId).emit('user-video-toggle', { userId, isVideoEnabled });
    });

    socket.on('mute-user', async ({ podId, targetUserId, muteType, isMuted }: { podId: string; targetUserId: string; muteType: 'audio' | 'video'; isMuted: boolean }) => {
        if (await podManager.isUserAuthorized(podId, userId)) {
            const success = await podManager.muteUser(podId, targetUserId, muteType, isMuted);
            if (success) {
                io.to(podId).emit('user-muted', { userId: targetUserId, muteType, isMuted });
                logger.info(`User ${targetUserId} ${isMuted ? 'muted' : 'unmuted'} ${muteType} by ${userId} in pod ${podId}`);
            } else {
                socket.emit('mute-failed', { error: 'Failed to mute user' });
            }
        } else {
            socket.emit('mute-failed', { error: 'Not authorized to mute users' });
        }
    });

    socket.on('mute-all', async ({ podId, muteType, isMuted }: { podId: string; muteType: 'audio' | 'video'; isMuted: boolean }) => {
        if (await podManager.isUserAuthorized(podId, userId)) {
            const success = await podManager.muteAllUsers(podId, muteType, isMuted);
            if (success) {
                io.to(podId).emit('all-users-muted', { muteType, isMuted });
                logger.info(`All users ${isMuted ? 'muted' : 'unmuted'} ${muteType} by ${userId} in pod ${podId}`);
            } else {
                socket.emit('mute-all-failed', { error: 'Failed to mute all users' });
            }
        } else {
            socket.emit('mute-all-failed', { error: 'Not authorized to mute all users' });
        }
    });

    socket.on('toggle-local-audio', async ({ podId, isAudioEnabled }: { podId: string; isAudioEnabled: boolean }) => {
        await podManager.updateUserInfo(podId, userId, { isAudioEnabled });
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-local-video', async ({ podId, isVideoEnabled }: { podId: string; isVideoEnabled: boolean }) => {
        await podManager.updateUserInfo(podId, userId, { isVideoEnabled });
        socket.to(podId).emit('user-video-toggle', { userId, isVideoEnabled });
    });
}