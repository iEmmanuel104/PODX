"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter, usePathname } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { LoadingOverlay } from "@/components/ui/loading";
import toast from "react-hot-toast";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [authState, setAuthState] = useState<"initializing" | "authenticating" | "authenticated" | "unauthenticated">("initializing");

    const handleAuth = useCallback(async () => {
        if (!authenticated || !privyUser || !privyUser.wallet) {
            setAuthState("unauthenticated");
            return;
        }

        setAuthState("authenticating");
        try {
            if (!storeUser.user || !storeUser.isLoggedIn) {
                const walletAddress = privyUser.wallet.address;
                if (!walletAddress) throw new Error("No wallet address found");

                const result = await findOrCreateUser({ walletAddress, hash: true }).unwrap();
                const userData = result.data as UserInfo;
                dispatch(setUser(userData));
                if (userData?.signature) {
                    dispatch(setSignature(userData.signature));
                }
            }
            setAuthState("authenticated");
            redirectUser();
        } catch (error) {
            console.error("Authentication error:", error);
            toast.error("Authentication error");
            logout();
            dispatch(logOut());
            router.push("/");
            setAuthState("unauthenticated");
        }
    }, [authenticated, privyUser, storeUser, findOrCreateUser, dispatch, logout, router]);

    const redirectUser = useCallback(() => {
        const pendingSessionCode = localStorage.getItem("pendingSessionCode");
        if (pendingSessionCode) {
            localStorage.removeItem("pendingSessionCode");
            router.push(`/pod/join/${pendingSessionCode}`);
        } else if (pathname && !pathname.startsWith("/pod")) {
            router.push("/pod");
        }
    }, [router, pathname]);

    useEffect(() => {
        if (ready) {
            handleAuth();
        }
    }, [ready, handleAuth]);

    useEffect(() => {
        // Prefetch the pod page
        router.prefetch("/pod");
    }, [router]);

    if (authState === "initializing" || authState === "authenticating") {
        const loadingText = authState === "initializing" ? "Initializing..." : "Authenticating...";
        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay text={loadingText} />
            </div>
        );
    }

    return <>{children}</>;
}
