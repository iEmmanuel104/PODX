"use client";

import { SERVER_SOCKET_URL } from '@/constants';
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { setSocketConnected } from '@/store/slices/socketSlice';

let socket: Socket | null = null;

export const initializeSocketConnection = (token: string) => {
    console.log('Initializing socket connection');
    console.log({ signature: token });

    if (typeof window === 'undefined') return null;

    if (socket) {
        socket.disconnect();
    }

    socket = io(SERVER_SOCKET_URL, {
        auth: { signature: token },
        transports: ['websocket', 'polling'],
        secure: SERVER_SOCKET_URL.startsWith('https'),
        withCredentials: true,
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

export const getSocket = () => {
    if (typeof window === 'undefined') return null;
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};