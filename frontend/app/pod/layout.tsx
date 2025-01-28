'use client';
import React, { useEffect, useState, memo } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LoadingOverlay } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/pod/errorBoundary';
import nextDynamic from 'next/dynamic';
import { useAppSelector } from '@/store/hooks';

// Types
type LayoutProps = {
    children: ReactNode;
    params: {
        id?: string;
    };
};

// Dynamic import helper
const DynamicMeetProvider = nextDynamic(() => import('@/providers/meetProvider/index'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-[#121212]">
            <LoadingOverlay text="Preparing your session..." />
        </div>
    ),
});

// Memoized layout content component
const LayoutContent = memo<LayoutProps>(({ children, params }) => {
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { isLoggedIn } = useAppSelector(state => state.user);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // If not logged in, let AuthProvider handle the redirect
    if (!isLoggedIn) return null;

    const meetingId = id as string | undefined;

    if (isMounted) {
        const isValidMeetingId = meetingId ? /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingId) : true;

        if (pathname !== '/pod' && !pathname.startsWith('/pod/join') && !isValidMeetingId) {
            console.log('Invalid meeting ID and not on join page. Redirecting to /pod');
            router.replace('/pod');
            return null;
        }
    }

    return (
        <div className="max-h-screen bg-[#121212]">
            <ErrorBoundary fallback={<div>Failed to load meeting. Please try again.</div>}>
                <DynamicMeetProvider meetingId={meetingId} language="en">
                    {children}
                </DynamicMeetProvider>
            </ErrorBoundary>
        </div>
    );
});

LayoutContent.displayName = 'LayoutContent';

export default function Layout(props: LayoutProps) {
    return <LayoutContent {...props} />;
}
