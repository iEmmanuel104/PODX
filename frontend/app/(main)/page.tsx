'use client';

import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAppDispatch } from '@/store/hooks';
import { logOut } from '@/store/slices/userSlice';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';

// Dynamically import components that aren't needed for initial render
const Logo = dynamic(() => import('@/public/images/icons/Logo'), {
    loading: () => <div className="w-[174px] h-[43px] animate-pulse bg-gray-700" />,
});

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
        <main
            className={`bg-[#151515] min-h-screen text-white flex flex-col items-center ${balige.variable}`}
        >
            <div
                className="container relative z-10 mx-auto px-4 flex flex-col items-center justify-center"
                style={{ minHeight: 'calc(100vh - 100px)' }}
            >
                <div className="flex flex-col items-center gap-24 md:gap-32">
                    <div className="w-[174px] h-[43px] mt-16">
                        <Logo />
                    </div>
                    <div className="flex flex-col items-center gap-16">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex justify-center items-center">
                                <div className="rounded-full bg-gradient-to-r from-[#552FC9] to-[#D7B35D] p-[1px]">
                                    <div className="rounded-full bg-[#151515] px-6 py-2">
                                        <span className="text-xs uppercase tracking-[0.2em] text-white">
                                            A creator's workspace
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <h1 className="font-balige text-[42px] leading-[1.2] text-center max-w-[665px] text-gray-100">
                                Host meetings, record sessions,{'\n'}
                                earn proof of attendance, and{' '}
                                <span className="inline-block">
                                    <span className="bg-gradient-to-r from-[#D7B35D] via-[#9F7F45] to-[#552FC9] text-transparent bg-clip-text">
                                        tip
                                    </span>
                                </span>{' '}
                                seamlessly
                            </h1>
                        </div>

                        <button
                            className="py-3 px-8 rounded-xl bg-[#6032F6] hover:bg-[#4C28C4] transition-colors duration-200 text-white font-medium text-lg"
                            onClick={handleConnect}
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
            <RetroGrid />
        </main>
    );
}
