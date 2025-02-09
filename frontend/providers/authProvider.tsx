'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading';
import { useTypedSelector, useAppDispatch } from '@/store/config/store';
import { setUser, setSignature,logOut } from '@/store/auth/slice';
import { UserInfo } from '@/store/user/types';
import { useValidateUserMutation } from '@/store/user/slice';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { isLoggedIn } = useTypedSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [validateUser, {isLoading: isValidating}] = useValidateUserMutation();

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
                console.log('Setting signature:', result.data);
                
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

    // Handle authentication and redirection without useEffect
    const handleAuthFlow = useCallback(async () => {
        if (!ready || isLoading) return;

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
        } else if (!authenticated && isLoggedIn) {
            dispatch(logOut());
        }
    }, [ready, isLoading, pathname, authenticated, isLoggedIn, handleAuthentication, redirectToPod, dispatch]);

    // Call handleAuthFlow when necessary
    useEffect(() => {
        handleAuthFlow();
    }, [handleAuthFlow]);

    // Show loading overlay
    if (isLoading || isValidating) {
        return (
            <div className="fixed inset-0 bg-[#121212] bg-opacity-90 backdrop-blur-sm">
                <LoadingOverlay text={`${isLoading ? 'Connecting...' : 'Validating User...'}`} />
            </div>
        );
    }

    return <>{children}</>;
}
