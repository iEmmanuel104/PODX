// app/pod/(stream)/layout.tsx
'use client';



import React, { useEffect, useState, memo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import nextDynamic from 'next/dynamic';
import { useTypedSelector } from '@/store/config/store';
import { storage } from '@/utils/storage';
import { LoadingOverlay } from '@/components/ui/loading';

// Cache keys with namespace to avoid collisions
const CACHE_KEYS = {
    MEETING: {
        ID: (id: string) => `pod_meeting_${id}`,
        STATE: (id: string) => `pod_state_${id}`,
        PROVIDER: 'pod_provider_cache',
        LAYOUT: (id: string) => `pod_layout_${id}`,
        PARTICIPANTS: (id: string) => `pod_participants_${id}`,
    },
};

// Preload and cache critical assets
const preloadAssets = async () => {
    try {
        const assets = [
            '/images/default-avatar.png',
            // Add other critical assets here
        ];
        const promises = assets.map(asset => fetch(asset, { method: 'GET', cache: 'force-cache' }));
        await Promise.all(promises);
    } catch (error) {
        console.warn('Asset preload error:', error);
    }
};

// Optimized loading with skeleton
const LoadingFallback = memo(() => (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-600" />
    </div>
));
LoadingFallback.displayName = 'LoadingFallback';

// Pre-cache providers
const StreamMeetProvider = nextDynamic(
    async () => {
        const [providerModule, _] = await Promise.all([
            import('@/providers/meetProvider'),
            preloadAssets(),
        ]);
        storage.set(CACHE_KEYS.MEETING.PROVIDER, true, 86400);
        return providerModule.StreamMeetProvider;
    },
    {
        ssr: false,
        loading: () => (
            <LoadingOverlay text="We beseech thee to hold fast, for thy session is nigh prepared...." />
        ),
        suspense: true,
    }
);

const ErrorBoundary = nextDynamic(
    () => import('@/components/pod/errorBoundary').then(mod => mod.ErrorBoundary),
    {
        ssr: false,
        suspense: true,
    }
);

// Add session storage helpers
const SESSION_KEY = 'pod_session_state';
const getSessionState = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    } catch {
        return {};
    }
};

const setSessionState = (state: any) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
};

// Memoize the layout component
const StreamLayout = memo(({ children }: { children: ReactNode }) => {
    const params = useParams();
    // Type-safe way to get id from params
    const id = params?.['id'] as string | undefined;
    const router = useRouter();
    const { isLoggedIn } = useTypedSelector(state => state.auth);
    const [isValidId, setIsValidId] = useState(() => {
        return storage.get(CACHE_KEYS.MEETING.ID(id as string)) ?? true;
    });

    // Cache layout state with debouncing
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const cacheState = () => {
            const layoutState = {
                id,
                isValidId,
                timestamp: Date.now(),
            };
            storage.set(CACHE_KEYS.MEETING.LAYOUT(id as string), layoutState, 3600);
        };

        timeoutId = setTimeout(cacheState, 1000);
        return () => clearTimeout(timeoutId);
    }, [id, isValidId]);

    // Validate meeting ID with caching
    useEffect(() => {
        const validateAndCacheId = async () => {
            if (!id) return;

            // Check cache first
            const cachedValidation = storage.get(CACHE_KEYS.MEETING.ID(id as string));
            if (cachedValidation !== null) {
                setIsValidId(cachedValidation);
                return;
            }

            const isValid = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(id as string);
            setIsValidId(isValid);

            // Cache validation result
            storage.set(CACHE_KEYS.MEETING.ID(id as string), isValid, 7200); // 2h cache

            if (!isValid) {
                console.debug("Intercepted direct to /pod!");
                // router.replace('/pod');
            }
        };

        validateAndCacheId();
    }, [id, router]);

    // Early returns
    // if (!isLoggedIn) return null;
    if (!isValidId) return <LoadingOverlay text="Validating session..." />;

    return (
        <div className="max-h-screen bg-[#121212]">
            <Suspense
                fallback={
                    <LoadingOverlay text="We beseech thee to hold fast, for thy session is nigh prepared...." />
                }
            >
                <ErrorBoundary fallback={<div>Failed to load meeting. Please try again.</div>}>
                    <StreamMeetProvider meetingId={id as string} language="en">
                        {children}
                    </StreamMeetProvider>
                </ErrorBoundary>
            </Suspense>
        </div>
    );
});

StreamLayout.displayName = 'StreamLayout';

export default StreamLayout;
