"use client";
import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter, usePathname } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { user: storeUser, isLoggedIn } = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [isLoading, setIsLoading] = useState(false);

    // Memoized redirect function
    const redirectToPod = useCallback(() => {
        const pendingSessionCode = localStorage.getItem("pendingSessionCode");
        if (pendingSessionCode) {
            localStorage.removeItem("pendingSessionCode");
            router.replace(`/pod/join/${pendingSessionCode}`);
        } else if (!pathname?.startsWith("/pod")) {
            router.replace("/pod");
        }
    }, [pathname, router]);

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

            redirectToPod();
        } catch (error) {
            console.error("Authentication error:", error);
            logout();
            dispatch(logOut());
            router.replace("/");
        }
    }, [privyUser, findOrCreateUser, dispatch, logout, router, redirectToPod]);

    useEffect(() => {
        if (!ready || isLoading) return;

        // If user is authenticated but not in store, authenticate them
        if (authenticated && privyUser && !isLoggedIn) {
            setIsLoading(true);
            handleAuthentication().finally(() => setIsLoading(false));
        }
        // If user is authenticated and in store, just redirect
        else if (authenticated && isLoggedIn) {
            redirectToPod();
        }
    }, [ready, authenticated, privyUser, isLoggedIn, handleAuthentication, redirectToPod, isLoading]);

    // Only show loading overlay when necessary
    if (!ready) {
        return null; // Let the landing page render instead of showing a loading screen
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#121212] bg-opacity-50 backdrop-blur-sm">
                <LoadingOverlay text="Authenticating..." />
            </div>
        );
    }

    return <>{children}</>;
}
