import { SERVER_URL } from '@/constants';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initializeSocket = (token: string) => {
    const socketUrl = SERVER_URL;

    socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        secure: socketUrl.startsWith('https'),
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initializeSocket first.');
    }
    return socket;
};