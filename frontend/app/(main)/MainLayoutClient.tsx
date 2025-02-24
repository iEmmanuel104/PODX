'use client';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthProvider from '@/providers/authProvider';
import { clashGrotesk } from '@/constants';
import { storage } from '@/utils/storage';
import { LoadingOverlay } from '@/components/ui/loading';

// Cache keys
const CACHE_KEYS = {
    REDIRECT: 'main_redirect_state'
};

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Instant redirect check
    useEffect(() => {
        const shouldRedirect = () => {
            const path = window.location.pathname;
            // If we're at root and haven't cached a redirect check
            if (path === '/' && !storage.get(CACHE_KEYS.REDIRECT)) {
                storage.set(CACHE_KEYS.REDIRECT, true, 3600); // Cache for 1 hour
                return true;
            }
            return false;
        };

        if (shouldRedirect()) {
            // Use replace instead of push to prevent back navigation
            router.replace('/pod');
        }
    }, [router]);

    return (
        <div
            className={`${clashGrotesk.className} antialiased bg-[#151515] min-h-screen w-full relative`}
        >
            <Suspense fallback={<LoadingOverlay text="Initializing..." />}>
                <AuthProvider>{children}</AuthProvider>
            </Suspense>
        </div>
    );
} 