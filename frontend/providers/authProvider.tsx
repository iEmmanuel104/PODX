'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading';
import { useTypedSelector, useAppDispatch } from '@/store/config/store';
import { setUser, setSignature, logOut } from '@/store/auth/slice';
import { UserInfo } from '@/store/user/types';
import { useValidateUserMutation } from '@/store/user/slice';
import { getSessionCode } from '@/utils/storage';
import { CachId } from '@/constants';
import { useNavigate } from '@/hooks/useNavigate';
import toast from 'react-hot-toast';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { isLoggedIn } = useTypedSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const pathname = usePathname();
    const [validateUser, { isLoading: isValidating }] = useValidateUserMutation();

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
                console.debug('Setting signature:', result.data);

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


    const pendingSessionCode = useMemo(() => {
        const storedSessionCode = localStorage.getItem(CachId);
        const cookieSessionCode = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${CachId}=`))
            ?.split('=')[1];
        const sessionCode = storedSessionCode || cookieSessionCode;

        if (sessionCode) {
            localStorage.setItem(CachId, sessionCode);
        }

        // Clear the cookie since we've moved it to localStorage
        if (cookieSessionCode) {
            document.cookie = `${CachId}=; path=/; max-age=0`;
        }

        console.debug('Stored pending session code for redirect after login:', sessionCode);

        return sessionCode;
    }, []);

    // Handle redirection
    const redirectToPod = useCallback(async () => {
        // const pendingSessionCode = localStorage.getItem(CachId);

        console.debug('Redirect To Prod!', pendingSessionCode);
        const targetPath = pendingSessionCode ? `/pod/join/${pendingSessionCode}` : '/pod';
        console.debug('Redirect TARGET!', targetPath);

        if (pathname !== targetPath) {
            // router.replace(targetPath);
            if (pendingSessionCode) {
                toast.success(`Proceeding to meeting: ${pendingSessionCode}`);
                localStorage.removeItem(CachId);
            }
            navigate(targetPath, { replace: true });
        }
    }, [pathname, pendingSessionCode, navigate]);

    // Handle authentication and redirection without useEffect
    const handleAuthFlow = useCallback(async () => {
        // Check if we're on a pod page, even before Privy is ready
        const isPodJoinPage: boolean = Boolean(pathname?.startsWith('/pod/join/'));
        const isDirectPodPage: boolean = Boolean(pathname?.startsWith('/pod/')) && !isPodJoinPage && pathname !== '/pod';
        
        // Safety check for pod pages before Privy is ready
        if ((isPodJoinPage || isDirectPodPage) && !ready) {
            console.debug('Pod page detected but Privy not ready yet - checking local login state');
            // If we're on a pod page but Privy isn't ready yet, check local state
            if (!isLoggedIn && pathname) {
                // Save the session code
                getSessionCode(pathname, {isDirectPodPage, isPodJoinPage});
                
                // Redirect to home
                // router.replace('/');
                console.debug('Redirecting from pod page before Privy ready - not logged in');
                toast.error(`Authentication is required`);
                navigate("/", { replace: true });
                return;
            }
        }

        // Skip further processing if not ready
        if (!ready || isLoading) return;

        // Skip auth checks only if pathname is not available
        if (!pathname) return;

        // If user is on any pod page but not authenticated, redirect to home
        if ((isPodJoinPage || isDirectPodPage) && !authenticated) {
            // Extract the session code
            getSessionCode(pathname, {isDirectPodPage, isPodJoinPage});

            // Redirect to home page
            navigate('/', { replace: true });
            console.debug('Redirecting unauthenticated user from pod page to home', { pathname });
            return;
        }

        // Skip further authentication for active pod sessions if user is already authenticated
        const isActivePodPage = pathname.startsWith('/pod/') && authenticated;
        if (isActivePodPage && pathname !== '/pod' && isLoggedIn) return;

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
    }, [
        ready,
        isLoading,
        pathname,
        authenticated,
        isLoggedIn,
        handleAuthentication,
        redirectToPod,
        dispatch,
        // router,
        navigate,
    ]);

    // Call handleAuthFlow when necessary
    useEffect(() => {
        handleAuthFlow();
    }, [handleAuthFlow]);

    // Show loading overlay
    if (isLoading || isValidating) {
        return (
            <div className="fixed inset-0 bg-[#121212] bg-opacity-90 backdrop-blur-sm">
                <LoadingOverlay text={`${isLoading ? 'Signing in...' : 'Validating User...'}`} />
            </div>
        );
    }

    return <>{children}</>;
}
