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
    const { signMessage, initSigner, getAddress } = useAuthSigner();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const { wallets } = useWallets();

    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            try {
                console.log("AuthSigner:", { signMessage, initSigner, getAddress });
                if (authenticated && privyUser && wallets.length > 0) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");
                        const wallet = await initSigner();
                        console.log("Wallet initialized:", wallet);
                        if (!wallet) {
                            throw new Error("Failed to initialize signer");
                        }
                        const smartWallet = privyUser.smartWallet || privyUser.linkedAccounts.find((account) => account.type === "smart_wallet");
                        const walletAddress = smartWallet?.address || privyUser.wallet?.address;

                        if (!walletAddress) throw new Error("No wallet address found");

                        const result = await findOrCreateUser({ walletAddress }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));

                        const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                        try {
                            const signature = await signMessage(message);
                            dispatch(setSignature(signature));
                        } catch (signError) {
                            console.error("Error signing message:", signError);
                            // Handle signature error (e.g., user rejected signing)
                            // You might want to show a message to the user or take appropriate action
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
    }, [authenticated, privyUser, ready, wallets, initSigner, signMessage, getAddress, storeUser, dispatch, router]);

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
