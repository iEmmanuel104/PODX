"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Logo from "@/components/ui/logo";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, updateUser } from "@/store/slices/userSlice";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import UserInfoModal from "@/components/user/userInfoModal";
import { useAuthSigner } from "@/hooks/useAuthSigner";
import { SIGNATURE_MESSAGE } from "@/constants";

export default function Home() {
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { login, user, authenticated, ready } = usePrivy();
    console.log({user, authenticated});
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const { signMessage, initSigner } = useAuthSigner();

    // New useEffect to check for authenticated user and redirect
    useEffect(() => {
        if (ready && authenticated && user) {
            handleUserAuthentication();
        }
    }, [ready, authenticated, user]);

    const handleUserAuthentication = async () => {
        if (!user) return;

        const smartWallet = user.smartWallet || user.linkedAccounts.find((account) => account.type === "smart_wallet");
        // const walletAddress = user.wallet?.address || smartWallet?.address;
        const walletAddress = smartWallet?.address || user.wallet?.address

        if (walletAddress) {
            console.log({ walletAddress });
            try {
                await initSigner();
                const result = await findOrCreateUser({ walletAddress }).unwrap();
                const userData = result.data as UserInfo;

                setUserInfo(userData);
                dispatch(setUser(userData));

                const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                const signature = await signMessage(message);

                dispatch(setSignature(signature));

                if (userData.username.startsWith("guest-")) {
                    setShowUsernameModal(true);
                } else {
                    const pendingSessionCode = localStorage.getItem("pendingSessionCode");
                    if (pendingSessionCode) {
                        localStorage.removeItem("pendingSessionCode");
                        router.push(`/pod?code=${pendingSessionCode}`);
                    } else {
                        router.push("/landing");
                    }
                }
            } catch (error) {
                console.error("Error in user authentication:", error);
                // Handle error (e.g., show error message to user)
            }
        }
    };

    const handleConnect = async () => {
        try {
            await login();
            await handleUserAuthentication();
        } catch (error) {
            console.error("Error connecting wallet:", error);
            // Handle error (e.g., show error message to user)
        }
    };

    const handleUsernameUpdate = (newUsername: string) => {
        dispatch(updateUser({ username: newUsername }));
        setShowUsernameModal(false);
        const pendingSessionCode = localStorage.getItem("pendingSessionCode");
        if (pendingSessionCode) {
            localStorage.removeItem("pendingSessionCode");
            router.push(`/pod?code=${pendingSessionCode}`);
        } else {
            router.push("/landing");
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
                <Logo />

                <p className="text-xl text-center mb-12">Connect onchain to a world of decentralized applications.</p>

                <div className="w-full space-y-4">
                    <button
                        className="w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors bg-[#6032f6] hover:bg-[#3C3C3C]"
                        onClick={handleConnect}
                    >
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                    </button>
                </div>
            </div>

            {showUsernameModal && userInfo && (
                <UserInfoModal
                    isOpen={showUsernameModal}
                    onClose={() => setShowUsernameModal(false)}
                    initialUsername={userInfo.username}
                    onUpdate={handleUsernameUpdate}
                />
            )}
        </div>
    );
}
