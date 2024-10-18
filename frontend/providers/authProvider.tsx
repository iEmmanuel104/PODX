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
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const { signMessage, initSigner } = useAuthSigner();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const { wallets } = useWallets();

    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            try {
                if (authenticated && privyUser && wallets.length > 0) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");
                        const wallet = await initSigner();
                        if (!wallet) throw new Error("No wallet found");

                        const walletAddress = wallet.address;

                        if (!walletAddress) throw new Error("No wallet address found");

                        const result = await findOrCreateUser({ walletAddress }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));

                        try {
                            const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                            const signature = await signMessage(message);
                            dispatch(setSignature(signature));
                            console.log(`Signature obtained successfully`);
                        } catch (signError) {
                            console.error("Failed to sign message:", signError);
                            // Handle signature failure (e.g., user rejected, or wallet doesn't support signing)
                            // You might want to show an error message to the user or take appropriate action
                        }

                        userData.username.startsWith("guest-") ? router.push("/") : redirectUser();
                    } else {
                        console.log('Store user found, redirecting');
                        redirectUser();
                    }
                }
            } catch (error) {
                console.error("Authentication error:", error);
                // Handle error (e.g., show error message to user)
            } finally {
                setIsAuthenticating(false);
            }
        };

        handleAuth();
    }, [authenticated, privyUser, ready, wallets, initSigner, signMessage, findOrCreateUser, dispatch, router, storeUser.user, storeUser.isLoggedIn]);

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

    if (!ready || isAuthenticating) {
        console.log("Displaying loading overlay");
        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay />
            </div>
        );
    }

    return <>{children}</>;
}
