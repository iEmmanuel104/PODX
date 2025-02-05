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

    React.useEffect(() => {
        if (!isLoggedIn) {
            router.push('/');
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#151515] text-white flex flex-col overflow-x-clip [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
            {/* Fixed header */}
            <header className="sticky top-0 pt-4 z-50 bg-[#151515]/95 backdrop-blur-md transition-all duration-200">
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <UserDetails user={user} />
                </div>
            </header>

            {/* Main content area with proper padding and scrolling */}
            <main className="flex-1 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {children}
                </div>
            </main>

            {/* Fixed footer */}
            <footer className="sticky bottom-0 pb-4 z-50 bg-[#151515]/95 backdrop-blur-md transition-all duration-200">
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <Footer />
                </div>
            </footer>
        </div>
    );
}

export default SimpleLayout;
