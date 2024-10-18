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
    const { user: privyUser, authenticated, ready } = usePrivy();
    const storeUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const { signMessage, initSigner, getAddress } = useAuthSigner();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!ready || isAuthenticating) return;

        const handleAuth = async () => {
            setIsAuthenticating(true);
            setIsLoading(true);
            try {
                if (authenticated && privyUser) {
                    console.log("Authenticated user detected");
                    if (!storeUser.user || !storeUser.isLoggedIn) {
                        console.log("Authenticating user to get store data");
                        let walletAddress;
                        try {
                            walletAddress = await getAddress();
                        } catch (error) {
                            console.error("Failed to get wallet address:", error);
                            throw new Error("No wallet address found");
                        }

                        if (!walletAddress) throw new Error("No wallet address found");

                        const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                        const signatureOrFlag = await signMessage(message);

                        let signature = signatureOrFlag;
                        if (signatureOrFlag === 'NON_EMBEDDED_WALLET') {
                            console.log('Non-embedded wallet detected, not using signature');
                            signature = undefined;
                        } else {
                            dispatch(setSignature(signatureOrFlag));
                        }

                        const result = await findOrCreateUser({
                            walletAddress,
                            signature
                        }).unwrap();
                        const userData = result.data as UserInfo;
                        dispatch(setUser(userData));

                        setIsLoading(false);
                        if (userData.username.startsWith("guest-")) {
                            router.push("/");
                        } else {
                            redirectUser();
                        }
                    } else {
                        console.log('Store user found, redirecting');
                        setIsLoading(false);
                        redirectUser();
                    }
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                dispatch(logOut());
                setIsLoading(false);
            } finally {
                setIsAuthenticating(false);
            }
        };

        handleAuth();
    }, [authenticated, privyUser, ready, getAddress, signMessage, findOrCreateUser, dispatch, router, storeUser.user, storeUser.isLoggedIn]);

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

    if (!ready || isAuthenticating || isLoading) {
        console.log("Displaying loading overlay");
        return (
            <div className="h-screen w-screen bg-[#121212]">
                <LoadingOverlay />
            </div>
        );
    }

    return <>{children}</>;
}
