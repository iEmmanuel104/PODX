'use client';
import React, { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import UserDetails from '@/components/user/userDetails';
import Footer from '@/components/common/Footer';
import { useTypedSelector } from '@/store/config/store';
import RetroGrid from '@/components/ui/retro-grid';

function SimpleLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    useLayoutEffect(() => {
        setMounted(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setVisible(true);
            });
        });
    }, []);

    useLayoutEffect(() => {
        if (mounted && !isLoggedIn) {
            setVisible(false);
            router.replace('/');
        }
    }, [isLoggedIn, router, mounted]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 bg-[#151515] text-white md:overflow-hidden overflow-auto">
            {/* Background Grid */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
                <RetroGrid />
            </div>

            {/* Content wrapper */}
            <div
                className="relative z-10 flex flex-col h-full"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: `translateY(${visible ? '0' : '10px'})`,
                    transition: 'opacity 150ms ease-out, transform 150ms ease-out',
                }}
            >
                {/* Header */}
                <header className="flex-none z-20 bg-[#151515]/95 backdrop-blur-md transition-all duration-200">
                    <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
                        {user ? <UserDetails user={user} /> : null}
                    </div>
                </header>

                {/* Main content area */}
                <main className="flex-1 relative transition-transform duration-200 mt-12 md:mt-0">
                    <div className="max-w-[800px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-6">
                        <div className="flex flex-col items-center justify-center h-full">
                            {children}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex-none z-20 backdrop-blur-sm transition-all duration-200">
                    <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
                        <Footer />
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default SimpleLayout;