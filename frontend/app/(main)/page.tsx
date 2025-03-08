'use client';

import { useCallback, useEffect, Suspense } from 'react';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';
import Logo from '@/public/images/icons/Logo';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LoadingOverlay } from '@/components/ui/loading';
import { CachId } from '@/constants';

// Cache keys
const CACHE_KEYS = {
    AUTH_STATE: 'auth_state',
    COMPONENTS_LOADED: 'components_loaded',
    UI: {
        COMPONENTS: 'ui_components',
    },
    REDIRECT: 'main_redirect_state',
};

// Dynamically import components with caching
const DynamicComponents = {
    Footer: dynamic(
        () =>
            import('@/components/common/Footer').then(mod => {
                storage.set(CACHE_KEYS.UI.COMPONENTS, { footer: true }, 3600);
                return mod;
            }),
        {
            loading: () => <LoadingSpinner size="sm" />,
            suspense: true,
        }
    ),
    RetroGrid: dynamic(
        () =>
            import('@/components/ui/retro-grid').then(mod => {
                storage.set(CACHE_KEYS.UI.COMPONENTS, { grid: true }, 3600);
                return mod;
            }),
        {
            loading: () => <LoadingSpinner size="sm" />,
            suspense: true,
        }
    ),
};

const Footer = DynamicComponents.Footer;
const RetroGrid = DynamicComponents.RetroGrid;

const balige = localFont({
    src: '../fonts/Balige - Personal Use.otf',
    variable: '--font-balige',
    preload: true,
    display: 'swap',
});

export default function LandingPage() {
    const { connect, ready } = useAuth();

    const getPendingSessionCode = useCallback(()=>{
        return localStorage.getItem(CachId);
    },[])

    // Cache auth state
    const handleConnect = useCallback(async () => {
        try {
            await connect();
            // Cache successful connection
            storage.set(CACHE_KEYS.AUTH_STATE, { connected: true, timestamp: Date.now() });
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    }, [connect]);


    useEffect(() => {
        if (ready) {
            storage.set(CACHE_KEYS.AUTH_STATE, { ready, timestamp: Date.now() });
        }
    }, [ready]);


    useEffect(() => {

        async function attemptLogin() {
            // const shouldAutoLogin = new URL(window.location.href).searchParams.get('ou');
            const pendingSessionCode = getPendingSessionCode();
            const shouldAutoLogin = Boolean(pendingSessionCode);

            // Attempt auto login
            if (!Boolean(shouldAutoLogin)) {
                console.debug("Not attempting auto login!: reason =", shouldAutoLogin);
                return;
            };

            console.debug('Attempt Auto Login');
            await connect();
            console.debug('Attempted Auto Login', pendingSessionCode);
            return;
        }


        attemptLogin();

        // If we somehow end up here, redirect immediately
        // if (!storage.get(CACHE_KEYS.REDIRECT)) {
        //     storage.set(CACHE_KEYS.REDIRECT, true, 3600);
        //     router.replace('/pod');
        // }
    }, [connect, getPendingSessionCode]);

    if (!ready) return <LoadingOverlay text="Redirecting..." />;

    return (
        <main className={`relative min-h-screen text-white ${balige.variable} w-full`}>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
                <div className="absolute inset-0 w-full overflow-hidden pointer-events-none">
                    <RetroGrid />
                </div>

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

                                    {/* CTA Button - Added pointer-events-auto to ensure clickability */}
                                    <button
                                        className="relative z-20 pointer-events-auto py-3 px-8 rounded-xl bg-[#6032F6] hover:bg-[#4C28C4] 
                                                 transition-all duration-200 text-white font-medium text-base sm:text-lg 
                                                 hover:scale-105 hover:shadow-lg active:scale-95"
                                        onClick={handleConnect}
                                    >
                                        Get started
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Section */}
                    <Suspense fallback={<LoadingSpinner size="sm" />}>
                        <div className="container mx-auto px-4 py-6">
                            <Footer />
                        </div>
                    </Suspense>
                </div>
            </Suspense>
        </main>
    );
}
