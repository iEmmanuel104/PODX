import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { generateRoomId } from '../socket-helper/generateRoomId';
import { logger } from '../../utils/logger';

export default function attachPodHandlers(io: Server, socket: AuthenticatedSocket) {
    const userId = socket.userId;

    socket.on('create-pod', async (callback) => {
        const podId = generateRoomId();
        socket.join(podId);
        callback({ podId });
        logger.info(`User ${userId} created pod ${podId}`);
    });

    socket.on('join-pod', async (podId, callback) => {
        const room = io.sockets.adapter.rooms.get(podId);
        if (room) {
            socket.join(podId);
            socket.to(podId).emit('user-joined', { userId, socketId: socket.id });
            callback({ success: true });
            logger.info(`User ${userId} joined pod ${podId}`);
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('leave-pod', async (podId) => {
        socket.leave(podId);
        socket.to(podId).emit('user-left', { userId, socketId: socket.id });
        logger.info(`User ${userId} left pod ${podId}`);
    });

    socket.on('toggle-audio', ({ podId, isAudioEnabled }) => {
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-video', ({ podId, isVideoEnabled }) => {
        socket.to(podId).emit('user-video-toggle', { userId, isVideoEnabled });
    });

    socket.on('send-message', ({ podId, message }) => {
        socket.to(podId).emit('new-message', { userId, message });
    });

    // WebRTC signaling
    socket.on('signal', ({ to, signal }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
        logger.info(`User ${userId} sent a signal to ${to}`);
    });
}