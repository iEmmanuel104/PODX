import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { logger } from '../utils/logger';
import socketAuthAccess, { AuthenticatedSocket } from './middlewares/socketAuthAccess';
import attachPodHandlers from './controllers/podHandler';
import { updateUserStatus } from './socket-helper/updateUserStatus';

let io: SocketIOServer;

export function initializeSocketIO(server: Server): void {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*', // Adjust this to your needs
            methods: ['GET', 'POST'],
        },
    });

    // Apply authentication middleware
    io.use(socketAuthAccess);

    io.on('connection', (socket: Socket) => {
        const authenticatedSocket = socket as AuthenticatedSocket;
        const userId = authenticatedSocket.userId;
        logger.info(`New WebSocket connection: ${socket.id} for user: ${userId}`);

        // Update user status to online
        updateUserStatus(userId, true);

        // Attach pod (room) handlers
        attachPodHandlers(io, authenticatedSocket);

        socket.on('disconnect', () => {
            logger.info(`WebSocket disconnected: ${socket.id} for user: ${userId}`);
            updateUserStatus(userId, false);
        });
    });
}

export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}
