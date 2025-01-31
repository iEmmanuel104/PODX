// app/pod/(stream)/layout.tsx
'use client';
import React, { useEffect, useState, memo } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import nextDynamic from 'next/dynamic';
import { useAppSelector } from '@/store/hooks';
import { LoadingOverlay } from '@/components/ui/loading';

const StreamMeetProvider = nextDynamic(
    () => import('@/providers/meetProvider').then(mod => mod.StreamMeetProvider),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-[#121212]">
                <LoadingOverlay text="Preparing your session..." />
            </div>
        ),
    }
);

const ErrorBoundary = nextDynamic(
    () => import('@/components/pod/errorBoundary').then(mod => mod.ErrorBoundary),
    { ssr: false }
);

function StreamLayout({ children }: { children: ReactNode }) {
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { isLoggedIn } = useAppSelector(state => state.user);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isLoggedIn) return null;

    const meetingId = id as string;

    if (isMounted) {
        const isValidMeetingId = meetingId ? /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingId) : true;

        if (!isValidMeetingId) {
            console.log('Invalid meeting ID. Redirecting to /pod');
            router.replace('/pod');
            return null;
        }
    }

    return (
        <div className="max-h-screen bg-[#121212]">
            <ErrorBoundary fallback={<div>Failed to load meeting. Please try again.</div>}>
                <StreamMeetProvider meetingId={meetingId} language="en">
                    {children}
                </StreamMeetProvider>
            </ErrorBoundary>
        </div>
    );
}

export default StreamLayout;
