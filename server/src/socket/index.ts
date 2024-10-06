import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { logger } from '../utils/logger';
import socketAuthAccess, { AuthenticatedSocket } from './middlewares/socketAuthAccess';
import attachPodHandlers from './controllers/podHandler';

let io: SocketIOServer;

export function initializeSocketIO(server: Server): void {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            methods: ['GET', 'POST'],
        },
    });

    // Apply authentication middleware
    io.use(socketAuthAccess);

    io.on('connection', (socket: Socket) => {
        const authenticatedSocket = socket as AuthenticatedSocket;
        const userId = authenticatedSocket.userId;
        logger.info(`New WebSocket connection: ${socket.id} for user: ${userId}`);

        // Attach pod (room) handlers
        attachPodHandlers(io, authenticatedSocket);
    });
}

export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}