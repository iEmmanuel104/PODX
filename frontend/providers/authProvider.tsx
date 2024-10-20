"use client";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter, usePathname } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            try {
                if (authenticated && privyUser && privyUser.wallet) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");

                        const walletAddress = privyUser?.wallet?.address;
                        const walletClientType = privyUser?.wallet?.walletClientType;

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
    }, [authenticated, dispatch, logout, ready, privyUser, router, storeUser]);

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

    if (!ready || isAuthenticating) {
        console.log("Displaying loading overlay");
        let loadingText = "";

        if (!ready) {
            loadingText = "Initializing...";
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
