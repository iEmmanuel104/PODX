"use client";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter, usePathname } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { useAuthSigner } from "@/hooks/useAuthSigner";
import { SIGNATURE_MESSAGE } from "@/constants";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { wallets, ready: walletsReady } = useWallets();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const { signMessage, initSigner } = useAuthSigner();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (!ready || !walletsReady || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            try {
                if (authenticated && privyUser && wallets.length > 0) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");
                        await initSigner();
                        const wallet = wallets[0];
                        const walletAddress = wallet.address;

                        if (!walletAddress) throw new Error("No wallet address found");

                        const result = await findOrCreateUser({ walletAddress }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));

                        const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                        const signature = await signMessage(message);
                        dispatch(setSignature(signature));

                        // Always redirect to pod page after authentication
                        router.push("/pod");
                    } else {
                        console.log("Store user found, redirecting");
                        redirectUser();
                    }
                }
            } catch (error) {
                console.error("Authentication error:", error);
                logout();
                dispatch(logOut());
                router.push("/");
            } finally {
                setIsAuthenticating(false);
            }
        };

        handleAuth();
    }, [authenticated, privyUser, ready, walletsReady, wallets]);

    const redirectUser = () => {
        console.log("Redirecting user");
        const pendingSessionCode = localStorage.getItem("pendingSessionCode");
        if (pendingSessionCode) {
            console.log("Redirecting to pending session");
            localStorage.removeItem("pendingSessionCode");
            router.push(`/pod/join/${pendingSessionCode}`);
        } else if (pathname && !pathname.startsWith("/pod")) {
            router.push("/pod");
        }
    };

    if (!ready || !walletsReady || isAuthenticating) {
        console.log("Displaying loading overlay");
        let loadingText = "";

        if (!ready) {
            loadingText = "Initializing...";
        } else if (!walletsReady) {
            loadingText = "Connecting to wallet...";
        } else if (isAuthenticating) {
            loadingText = "Authenticating...";
        }

        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay text={loadingText} />
            </div>
        );
    }

    return <>{children}</>;
}
