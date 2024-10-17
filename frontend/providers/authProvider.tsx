"use client";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, logOut } from "@/store/slices/userSlice";
import { useRouter } from "next/navigation";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import { useAuthSigner } from "@/hooks/useAuthSigner";
import { SIGNATURE_MESSAGE } from "@/constants";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user: privyUser, authenticated, ready, logout } = usePrivy();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const { signMessage, initSigner } = useAuthSigner();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            if (authenticated && privyUser) {
                console.log("auth mounted");
                console.log({ authenticated, privyUser, storeUser });
                if (!storeUser.user || storeUser.isLoggedIn === false) {
                    try {
                        console.log("authenticating user, tp get store");
                        await initSigner();
                        const smartWallet = privyUser.smartWallet || privyUser.linkedAccounts.find((account) => account.type === "smart_wallet");
                        const walletAddress = smartWallet?.address || privyUser.wallet?.address;

                        if (!walletAddress) throw new Error("No wallet address found");

                        const result = await findOrCreateUser({ walletAddress }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));

                        const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                        const signature = await signMessage(message);
                        dispatch(setSignature(signature));

                        if (userData.username.startsWith("guest-")) {
                            router.push("/"); // Show username modal on home page
                        } else {
                            redirectUser();
                        }
                    } catch (error) {
                        console.error("Authentication error:", error);
                        logout();
                        router.push("/");
                    }
                } else {
                    console.log('store user found redirecting');
                    redirectUser();
                }
            } else if (!authenticated && storeUser) {
                console.log("logging out from privy to clean state");
                dispatch(logOut());
                router.push("/");
            }
            setIsAuthenticating(false);
        };

        handleAuth();
    }, [ready, authenticated, privyUser, storeUser, dispatch, logout, router]);

    const redirectUser = () => {
        console.log("redirecting user hit");
        const pendingSessionCode = localStorage.getItem("pendingSessionCode");
        if (pendingSessionCode) {
            console.log("redirecting to pending session");
            localStorage.removeItem("pendingSessionCode");
            router.push(`/pod?code=${pendingSessionCode}`);
        } else {
            console.log("redirecting to landing");
            router.push("/landing");
        }
    };

    if (!ready || isAuthenticating) {
        console.log("loading overlay in auth provider");
        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay />
            </div>
        );
    }

    return <>{children}</>;
}
