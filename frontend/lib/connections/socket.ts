"use client";

import { SERVER_SOCKET_URL } from '@/constants';
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { setSocketConnected } from '@/store/slices/socketSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';

let socket: Socket | null = null;

export const initializeSocketConnection = (token: string): Socket | null => {
    console.log('Initializing socket connection');

    if (typeof window === 'undefined') return null;

    if (socket?.connected) {
        console.log('Socket already connected');
        return socket;
    }

    if (socket) {
        socket.disconnect();
    }

    socket = io(SERVER_SOCKET_URL, {
        auth: { signature: token },
        transports: ['websocket', 'polling'],
        secure: SERVER_SOCKET_URL.startsWith('https'),
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        timeout: 10000,
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
        store.dispatch(setSocketConnected(true));
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        store.dispatch(setSocketConnected(false));
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        store.dispatch(setSocketConnected(false));
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    if (typeof window === 'undefined') return null;
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        store.dispatch(setSocketConnected(false));
    }
};

export const useSocket = (): [Socket | null, boolean] => {
    const isConnected = useAppSelector((state) => state.socket.isConnected);
    return [socket, isConnected];
};

export const useSocketStatus = () => {
    return useAppSelector((state) => state.socket.isConnected);
};

export const useSocketInit = () => {
    const dispatch = useAppDispatch();

    return (token: string) => {
        const newSocket = initializeSocketConnection(token);
        if (newSocket) {
            dispatch(setSocketConnected(newSocket.connected));
        }
    };
};