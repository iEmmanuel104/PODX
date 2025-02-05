// app/pod/(simple)/layout.tsx
'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import UserDetails from '@/components/user/userDetails';
import Footer from '@/components/common/Footer';


function SimpleLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isLoggedIn, user } = useAppSelector(state => state.user);

    // Redirect if not logged in
    React.useEffect(() => {
        if (!isLoggedIn) {
            router.push('/');
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#151515] text-white flex flex-col">
            {/* Fixed header */}
            <header className="sticky top-0 z-50 bg-[#151515] backdrop-blur-sm">
                <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <React.Suspense fallback={<div className="h-12" />}>
                        <UserDetails user={user} />
                    </React.Suspense>
                </div>
            </header>

            {/* Main content area with proper padding and scrolling */}
            <main className="flex-1 relative">
                <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
            </main>

            {/* Fixed footer */}
            <footer className="sticky bottom-0 z-50 bg-[#151515]/80 backdrop-blur-sm">
                <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Footer />
                </div>
            </footer>
        </div>
    );
}

export default SimpleLayout;
