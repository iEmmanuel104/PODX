'use client';

import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAppDispatch } from '@/store/hooks';
import { logOut } from '@/store/slices/userSlice';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';
import Logo from '@/public/images/icons/Logo';

const Footer = dynamic(() => import('@/components/common/Footer'));
const RetroGrid = dynamic(() => import('@/components/ui/retro-grid'));

const balige = localFont({
    src: '../fonts/Balige - Personal Use.otf',
    variable: '--font-balige',
    preload: true,
    display: 'swap',
});

export default function LandingPage() {
    const dispatch = useAppDispatch();
    const { login, logout, ready } = usePrivy();

    const handleConnect = useCallback(async () => {
        try {
            await logout();
            dispatch(logOut());
            await login();
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    }, [logout, dispatch, login]);

    if (!ready) return null;

    return (
        <main className={`relative min-h-screen text-white ${balige.variable}`}>
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Content Section */}
                <div className="flex-grow flex items-center justify-center">
                    <div className="container mx-auto px-4 py-8 sm:py-12">
                        <div className="flex flex-col items-center gap-16 md:gap-24">
                            {/* Logo */}
                            <div className="w-[140px] sm:w-[174px] h-[35px] sm:h-[43px] animate-fade-in">
                                <Logo />
                            </div>

                            {/* Main Content */}
                            <div className="flex flex-col items-center gap-12 sm:gap-16 animate-slide-up">
                                {/* Tagline Section */}
                                <div className="flex flex-col items-center gap-4 sm:gap-6">
                                    {/* Badge */}
                                    <div className="flex justify-center items-center animate-fade-in">
                                        <div className="rounded-full bg-gradient-to-r from-[#552FC9] to-[#D7B35D] p-[1px] hover:p-[1.5px] transition-all duration-300">
                                            <div className="rounded-full bg-[#151515] px-4 sm:px-6 py-2">
                                                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white">
                                                    A creator's workspace
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Heading */}
                                    <h1 className="font-balige text-3xl sm:text-[42px] leading-[1.2] text-center max-w-[665px] text-gray-100 px-4">
                                        Host meetings, record sessions,
                                        <br className="hidden sm:block" />
                                        earn proof of attendance, and{' '}
                                        <span className="inline-block transition-transform hover:scale-105 duration-300">
                                            <span className="bg-gradient-to-r from-[#D7B35D] via-[#9F7F45] to-[#552FC9] text-transparent bg-clip-text">
                                                tip
                                            </span>
                                        </span>{' '}
                                        seamlessly
                                    </h1>
                                </div>

                                {/* CTA Button */}
                                <button
                                    className="py-3 px-8 rounded-xl bg-[#6032F6] hover:bg-[#4C28C4] transition-all duration-300 
                                             text-white font-medium text-base sm:text-lg hover:scale-105 hover:shadow-lg 
                                             active:scale-95"
                                    onClick={handleConnect}
                                >
                                    Get started
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="container mx-auto px-4 py-6">
                    <Footer />
                </div>

                {/* Background Grid - Positioned absolutely to cover full width */}
                <div className="absolute inset-0 w-full overflow-hidden">
                    <RetroGrid />
                </div>
            </div>
        </main>
    );
}
