'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useCallback, memo, ReactNode } from 'react';
import { CachId, STREAM_API_KEY } from '@/constants';
import { LoadingOverlay } from '@/components/ui/loading';
import { useStreamTokenProvider } from '@/hooks/useStreamTokenProvider';
import type { StreamChat } from 'stream-chat';
import type { Call, StreamVideoClient } from '@stream-io/video-react-sdk';
import { ErrorBoundary } from '@/components/pod/errorBoundary';
import { StreamConnectionPool } from './streamConnectionPool';
import { useTypedSelector } from '@/store/config/store';
import toast from 'react-hot-toast';

const DynamicStreamVideo = dynamic(
    () => import('@stream-io/video-react-sdk').then(mod => mod.StreamVideo),
    { ssr: false }
);

const DynamicStreamCall = dynamic(
    () => import('@stream-io/video-react-sdk').then(mod => mod.StreamCall),
    { ssr: false }
);

const DynamicChat = dynamic(() => import('stream-chat-react').then(mod => mod.Chat), {
    ssr: false,
});

type StreamMeetProviderProps = {
    meetingId: string;
    children: ReactNode;
    language: string;
};


const CACHE_KEYS = {
    AUTH_STATE: 'auth_state',
    COMPONENTS_LOADED: 'components_loaded',
    UI: {
        COMPONENTS: 'ui_components',
    },
    REDIRECT: 'main_redirect_state',
};

const connectionPool = new StreamConnectionPool();

export const StreamMeetProvider = memo<StreamMeetProviderProps>(
    ({ meetingId, children, language}) => {
        // const { connect, ready } = useAuth();
        const { auth, pod } = useTypedSelector(state => state);
        const { user, isLoggedIn } = auth;
        const { streamCallType } = pod;

        const [loading, setLoading] = useState(true);
        const [isMounted, setIsMounted] = useState(false);
        const [shouldAuthenticate, setShouldAuthenticate] = useState(false);

        const chatClientRef = useRef<StreamChat>();
        const videoClientRef = useRef<StreamVideoClient>();
        const callRef = useRef<Call>();

        const tokenProvider = useStreamTokenProvider();

        useEffect(() => {
            setIsMounted(true);
            return () => {
                connectionPool.disconnectAll();
            };
        }, []);

        const connectChatClient = useCallback(
            async (token: string) => {
                if (!chatClientRef.current) {
                    chatClientRef.current = await connectionPool.getChatClient(
                        STREAM_API_KEY as string
                    );
                }

                if (!chatClientRef.current.userID && user) {
                    await chatClientRef.current.connectUser(
                        {
                            id: user.id,
                            username: user.username,
                        },
                        token
                    );
                }
            },
            [user]
        );

        const connectVideoClient = useCallback(
            async (token: string) => {
                if (!videoClientRef.current && user) {
                    videoClientRef.current = await connectionPool.getVideoClient({
                        apiKey: STREAM_API_KEY as string,
                        user: {
                            id: user.id,
                            name: user.username,
                            image: user.displayImage,
                            custom: {
                                walletAddress: user.walletAddress,
                            },
                        },
                        tokenProvider: async () => token,
                    });
                }

                if (!callRef.current && videoClientRef.current && meetingId) {
                    const callType = streamCallType || 'default';
                    console.debug({ callType, meetingId, streamCallType });
                    callRef.current = videoClientRef.current.call(callType, meetingId);
                }
            },
            [user, meetingId, streamCallType]
        );

        useEffect(() => {
            if (!isMounted) return;

            const setupClients = async () => {
                if (isLoggedIn && user) {
                    try {
                        const token = await tokenProvider(user.walletAddress);
                        await Promise.all([connectChatClient(token), connectVideoClient(token)]);
                        setLoading(false);
                    } catch (error) {
                        console.error('Error setting up clients:', error);
                        setLoading(false);
                    }
                } else {
                    if (meetingId) {
                        localStorage.setItem(CachId, meetingId);
                    }
                    // router.push('/');

                    // Initiate 
                    toast.error('Please login to join this session', {
                        duration: 5000,
                    });
                }
            };

            setupClients();
        }, [
            isMounted,
            isLoggedIn,
            user,
            tokenProvider,
            connectChatClient,
            connectVideoClient,
            meetingId,
        ]);

        if (
            !isMounted ||
            loading ||
            !chatClientRef.current ||
            !videoClientRef.current ||
            !callRef.current
        ) {
            return (
                <div className="w-full h-full">
                    <LoadingOverlay text="We beseech thee to hold fast, for thy session is nigh prepared...." />
                </div>
            );
        }

        return (
            <ErrorBoundary
                fallback={
                    <div>Something went wrong with the stream connection. Please try again.</div>
                }
            >
                <div className="w-full h-full">
                    <DynamicChat client={chatClientRef.current}>
                        <DynamicStreamVideo client={videoClientRef.current}>
                            <DynamicStreamCall call={callRef.current}>{children}</DynamicStreamCall>
                        </DynamicStreamVideo>
                    </DynamicChat>
                </div>
            </ErrorBoundary>
        );
    }
);
StreamMeetProvider.displayName = 'StreamMeetProvider';
