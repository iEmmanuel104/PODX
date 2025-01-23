'use client';
import React, { useEffect, useState, memo } from 'react';
import { MeetProviderProps } from './types';
import { StreamMeetProvider } from './streamMeetProvider';
import { SimpleMeetProvider } from './components';
import { ErrorBoundary } from '@/components/pod/errorBoundary';

const MeetProvider = memo<MeetProviderProps>(({ meetingId, children, language = 'en' }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-full">{children}</div>;
    }

    return (
        <ErrorBoundary
            fallback={<div>Failed to load meeting provider. Please refresh the page.</div>}
        >
            <div className="w-full h-full">
                {!meetingId ? (
                    <SimpleMeetProvider>{children}</SimpleMeetProvider>
                ) : (
                    <StreamMeetProvider meetingId={meetingId} language={language}>
                        {children}
                    </StreamMeetProvider>
                )}
            </div>
        </ErrorBoundary>
    );
});
MeetProvider.displayName = 'MeetProvider';

export default MeetProvider;
export * from './types';
