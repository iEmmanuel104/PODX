'use client';

import React, { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import UserDetails from '@/components/user/userDetails';
import Footer from '@/components/common/Footer';
import { LoadingOverlay } from '@/components/ui/loading';

function SimpleLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isLoggedIn, user } = useAppSelector(state => state.user);
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    // Use useLayoutEffect to prevent initial flash
    useLayoutEffect(() => {
        setMounted(true);
        // Trigger fade-in animation on next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setVisible(true);
            });
        });
    }, []);

    useLayoutEffect(() => {
        if (mounted && !isLoggedIn) {
            // Fade out before redirect
            setVisible(false);
            const timer = setTimeout(() => {
                router.replace('/');
            }, 150); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, router, mounted]);

    // Return null on server-side to prevent hydration issues
    if (!mounted) return null;

    // Return null if not authenticated
    if (!isLoggedIn || !user) {
        return (
            <div
                className="fixed inset-0 bg-[#151515] flex items-center justify-center transition-opacity duration-150"
                style={{ opacity: visible ? 1 : 0 }}
            >
                <LoadingOverlay text="Loading..." />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[#151515] text-white flex flex-col overflow-x-clip transition-opacity duration-150"
            style={{
                opacity: visible ? 1 : 0,
                transform: `translateY(${visible ? '0' : '10px'})`,
                transition: 'opacity 150ms ease-out, transform 150ms ease-out',
            }}
        >
            {/* Fixed header with fade effect */}
            <header className="sticky top-0 pt-4 z-50 bg-[#151515]/95 backdrop-blur-md transition-all duration-200">
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <UserDetails user={user} />
                </div>
            </header>

            {/* Main content area with transform */}
            <main
                className="flex-1 relative transition-transform duration-200"
                style={{
                    transform: visible ? 'none' : 'translateY(10px)',
                    opacity: visible ? 1 : 0,
                }}
            >
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {children}
                </div>
            </main>

            {/* Fixed footer with fade effect */}
            <footer className="sticky bottom-0 pb-4 z-50 bg-[#151515]/95 backdrop-blur-md transition-all duration-200">
                <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <Footer />
                </div>
            </footer>
        </div>
    );
}

export default SimpleLayout;
