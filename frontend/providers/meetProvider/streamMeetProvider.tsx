'use client';
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { STREAM_API_KEY } from '@/constants';
import { LoadingOverlay } from '@/components/ui/loading';
import { useStreamTokenProvider } from '@/hooks/useStreamTokenProvider';
import type { StreamChat } from 'stream-chat';
import type { Call, StreamVideoClient } from '@stream-io/video-react-sdk';
import { StreamMeetProviderProps } from './types';
import { DynamicChat, DynamicStreamVideo, DynamicStreamCall } from './components';
import { ErrorBoundary } from '@/components/pod/errorBoundary';
import { StreamConnectionPool } from '../streamConnectionPool';
export const CALL_TYPE = 'default';
export const API_KEY = STREAM_API_KEY as string;
export const GUEST_ID = `guest_${nanoid(15)}`;

const connectionPool = new StreamConnectionPool();

export const StreamMeetProvider = memo<StreamMeetProviderProps>(
    ({ meetingId, children, language }) => {
        const { user, pod } = useAppSelector(state => state);
        const { user: appUser, isLoggedIn } = user;
        const { streamCallType } = pod;
        const [loading, setLoading] = useState(true);
        const [isMounted, setIsMounted] = useState(false);
        const chatClientRef = useRef<StreamChat>();
        const videoClientRef = useRef<StreamVideoClient>();
        const callRef = useRef<Call>();
        const tokenProvider = useStreamTokenProvider();
        const router = useRouter();

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

                if (!chatClientRef.current.userID && appUser) {
                    await chatClientRef.current.connectUser(
                        {
                            id: appUser.id,
                            username: appUser.username,
                        },
                        token
                    );
                }
            },
            [appUser]
        );

        const connectVideoClient = useCallback(
            async (token: string) => {
                if (!videoClientRef.current && appUser) {
                    videoClientRef.current = await connectionPool.getVideoClient({
                        apiKey: STREAM_API_KEY as string,
                        user: {
                            id: appUser.id,
                            name: appUser.username,
                            image: appUser.displayImage,
                            custom: {
                                walletAddress: appUser.walletAddress,
                            },
                        },
                        tokenProvider: async () => token,
                    });
                }

                if (!callRef.current && videoClientRef.current && meetingId) {
                    const callType = streamCallType || 'default';
                    console.log({ callType, meetingId, streamCallType });
                    callRef.current = videoClientRef.current.call(callType, meetingId);
                }
            },
            [appUser, meetingId, streamCallType]
        );

        useEffect(() => {
            if (!isMounted) return;

            const setupClients = async () => {
                if (isLoggedIn && appUser) {
                    try {
                        const token = await tokenProvider(appUser.walletAddress);
                        await Promise.all([connectChatClient(token), connectVideoClient(token)]);
                        setLoading(false);
                    } catch (error) {
                        console.error('Error setting up clients:', error);
                        setLoading(false);
                    }
                } else {
                    if (meetingId) {
                        localStorage.setItem('pendingSessionCode', meetingId);
                    }
                    router.push('/');
                }
            };

            setupClients();
        }, [
            isMounted,
            isLoggedIn,
            appUser,
            tokenProvider,
            connectChatClient,
            connectVideoClient,
            router,
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
                    <LoadingOverlay text="Preparing your meeting space..." />
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
