'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, setSignature, logOut } from '@/store/slices/userSlice';
import { useRouter, usePathname } from 'next/navigation';
import { useValidateUserMutation, UserInfo } from '@/store/api/userApi';
import { LoadingOverlay } from '@/components/ui/loading';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { user: storeUser, isLoggedIn } = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [validateUser] = useValidateUserMutation();

    // Simplified state management
    const [isLoading, setIsLoading] = useState(false);

    // Handle authentication
    const handleAuthentication = useCallback(async () => {
        if (!privyUser?.wallet?.address) return false;

        try {
            const result = await validateUser({
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
            return false;
        }
    }, [privyUser, validateUser, dispatch, logout]);

    // Handle redirection
    const redirectToPod = useCallback(async () => {
        const pendingSessionCode = localStorage.getItem('pendingSessionCode');
        const targetPath = pendingSessionCode ? `/pod/join/${pendingSessionCode}` : '/pod';

        if (pathname !== targetPath) {
            router.replace(targetPath);
            if (pendingSessionCode) {
                localStorage.removeItem('pendingSessionCode');
            }
        }
    }, [pathname, router]);

    useEffect(() => {
        if (!ready || isLoading) return;

        const handleAuthFlow = async () => {
            // Only handle auth flow for non-pod pages
            if (pathname.startsWith('/pod')) return;

            if (authenticated && !isLoggedIn) {
                setIsLoading(true);
                const success = await handleAuthentication();
                if (success) {
                    await redirectToPod();
                }
                setIsLoading(false);
            } else if (authenticated && isLoggedIn && pathname === '/') {
                await redirectToPod();
            }
        };

        handleAuthFlow();
    }, [
        ready,
        authenticated,
        isLoggedIn,
        handleAuthentication,
        redirectToPod,
        isLoading,
        pathname,
    ]);

    // Show loading overlay
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#121212] bg-opacity-90 backdrop-blur-sm">
                <LoadingOverlay text="Connecting..." />
            </div>
        );
    }

    return <>{children}</>;
}
