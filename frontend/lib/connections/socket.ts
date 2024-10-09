import { SERVER_SOCKET_URL } from '@/constants';
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { setSocketConnected } from '@/store/slices/socketSlice';

let socket: Socket | null = null;

export const initializeSocketConnection = (token: string) => {
    if (socket) {
        socket.disconnect();
    }

    socket = io(SERVER_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        secure: SERVER_SOCKET_URL.startsWith('https'),
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
        store.dispatch(setSocketConnected(true));
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        store.dispatch(setSocketConnected(false));
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call connectSocket first.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};