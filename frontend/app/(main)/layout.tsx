import { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthProvider from '@/providers/authProvider';
import { clashGrotesk } from '@/constants';

export const metadata: Metadata = {
    title: 'Pod X',
    description:
        'Real-time meetings by Podx on chain Using your browser, share your video, desktop.',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={`${clashGrotesk.className} antialiased bg-[#212121] min-h-screen flex justify-center items-center relative`}
        >
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
                <AuthProvider>{children}</AuthProvider>
            </Suspense>
        </div>
    );
}
