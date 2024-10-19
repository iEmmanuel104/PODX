"use client";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter, usePathname } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const { wallets, ready: walletsReady } = useWallets();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (!ready || !walletsReady || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            try {
                console.log({ authenticated, privyUser, storeUser, wallets });
                if (authenticated && privyUser && privyUser.wallet && wallets.length > 0) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");

                        const smartWallet = privyUser.smartWallet || privyUser.linkedAccounts.find((account) => account.type === "smart_wallet");
                        const walletAddress = smartWallet?.address || privyUser.wallet?.address;

                        if (!walletAddress) throw new Error("No wallet address found");

                        console.log({ walletToUseAuthprovider: walletAddress });
                        
                        const result = await findOrCreateUser({ walletAddress, hash: true }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));
                        if (userData?.signature) {
                            dispatch(setSignature(userData.signature));
                        }
                        
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
            console.log("Redirecting to pod page for path:", pathname);
            router.push("/pod");
        }
        //  else {
        //     logout();
        //     dispatch(logOut());
        //     router.push("/");
        // }
    };

    if (!ready || !walletsReady || isAuthenticating) {
        console.log("Displaying loading overlay");
        let loadingText = "";

        if (!ready) {
            loadingText = "Initializing...";
        } else if (!walletsReady) {
            loadingText = "Connecting to web3...";
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
