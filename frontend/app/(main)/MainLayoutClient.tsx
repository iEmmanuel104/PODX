'use client';
import { Suspense } from 'react';
import AuthProvider from '@/providers/authProvider';
import { clashGrotesk } from '@/constants';
import { LoadingOverlay } from '@/components/ui/loading';

// Cache keys
// const CACHE_KEYS = {
//     REDIRECT: 'main_redirect_state',
// };

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {

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
