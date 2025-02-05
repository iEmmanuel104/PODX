'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, setSignature, logOut } from '@/store/slices/userSlice';
import { useRouter, usePathname } from 'next/navigation';
import { useFindOrCreateUserMutation, UserInfo } from '@/store/api/userApi';
import { LoadingOverlay } from '@/components/ui/loading';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { user: storeUser, isLoggedIn } = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Memoized redirect function with transition state
    const redirectToPod = useCallback(async () => {
        if (isRedirecting) return;
        setIsRedirecting(true);

        try {
            const pendingSessionCode = localStorage.getItem('pendingSessionCode');
            const targetPath = pendingSessionCode ? `/pod/join/${pendingSessionCode}` : '/pod';

            // Only redirect if we're not already on the target path
            if (pathname !== targetPath) {
                // Use replace to prevent back button from returning to login
                await router.replace(targetPath);
                if (pendingSessionCode) {
                    localStorage.removeItem('pendingSessionCode');
                }
            }
        } finally {
            setIsRedirecting(false);
        }
    }, [pathname, router, isRedirecting]);

    // Handle authentication
    const handleAuthentication = useCallback(async () => {
        if (!privyUser?.wallet?.address) return;

        try {
            const result = await findOrCreateUser({
                walletAddress: privyUser.wallet.address,
                hash: true,
            }).unwrap();

            dispatch(
                setUser({
                    ...result.data,
                    walletType: privyUser.wallet.walletClientType,
                } as UserInfo)
            );

            if (result.data?.signature) {
                dispatch(setSignature(result.data.signature));
            }

            // Don't redirect here, let the effect handle it
            return true;
        } catch (error) {
            console.error('Authentication error:', error);
            logout();
            dispatch(logOut());
            router.replace('/');
            return false;
        }
    }, [privyUser, findOrCreateUser, dispatch, logout, router]);

    useEffect(() => {
        if (!ready || isLoading || isRedirecting) return;

        const handleAuthFlow = async () => {
            // If user is authenticated but not in store, authenticate them
            if (authenticated && privyUser && !isLoggedIn) {
                setIsLoading(true);
                const success = await handleAuthentication();
                setIsLoading(false);

                if (success) {
                    await redirectToPod();
                }
            }
            // If user is authenticated and in store, just redirect
            else if (authenticated && isLoggedIn && pathname === '/') {
                await redirectToPod();
            }
        };

        handleAuthFlow();
    }, [
        ready,
        authenticated,
        privyUser,
        isLoggedIn,
        handleAuthentication,
        redirectToPod,
        isLoading,
        isRedirecting,
        pathname,
    ]);

    // Show a minimal loading state
    if (!ready) return null;

    // Show loading overlay with transition
    if (isLoading || isRedirecting) {
        return (
            <div className="fixed inset-0 bg-[#121212] bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
                <LoadingOverlay text={isRedirecting ? 'Redirecting...' : 'Connecting...'} />
            </div>
        );
    }

    return <>{children}</>;
}
