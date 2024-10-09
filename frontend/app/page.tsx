"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, User } from "@privy-io/react-auth";
import Logo from "@/components/ui/logo";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setSignature, updateUser } from "@/store/slices/userSlice";
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";
import UserInfoModal from "@/components/user/userInfoModal";
import { useAuthSigner } from "@/hooks/useAuthSigner";
import { SIGNATURE_MESSAGE } from "@/constants";
import { connectSocket } from "@/lib/connections/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";

export default function Home() {
    const [selectedMethod, setSelectedMethod] = useState<"email" | "phone" | "wallet" | null>(null);
    const { ready, authenticated, user, login, logout } = usePrivy();
    console.log({ ready, authenticated, user });
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { signMessage } = useAuthSigner();

    useSocketListeners();

    useEffect(() => {
        if (authenticated && user) {
            handleUserAuthentication(user);
        }
    }, [authenticated, user]);

    const handleUserAuthentication = async (user: User) => {
        const smartWallet = user.linkedAccounts.find((account) => account.type === "smart_wallet");
        const walletAddress = user.wallet?.address || smartWallet?.address;

        if (walletAddress) {
            try {
                const result = await findOrCreateUser({ walletAddress }).unwrap();
                const userData = result.data as UserInfo;

                setUserInfo(userData);
                dispatch(setUser(userData));

                const message = SIGNATURE_MESSAGE || "Sign this message to authenticate";
                const signature = await signMessage(message);

                dispatch(setSignature(signature));

                connectSocket(signature);

                if (userData.username.startsWith("guest-")) {
                    setShowUsernameModal(true);
                } else {
                    router.push("/pod");
                }
            } catch (error) {
                console.error("Error finding or creating user:", error);
                // Handle error (e.g., show error message to user)
            }
        }
    };

    const handleConnect = async () => {
        setSelectedMethod("wallet");
        await login();
    };

    const handleUsernameUpdate = (newUsername: string) => {
        dispatch(updateUser({ username: newUsername }));
        setShowUsernameModal(false);
        router.push("/pod");
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
                <Logo />

                <p className="text-xl text-center mb-12">Connect onchain to a world of decentralized applications.</p>

                <div className="w-full space-y-4">
                    <button
                        className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${
                            selectedMethod === "wallet" ? "bg-[#6032f6]" : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                        }`}
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
