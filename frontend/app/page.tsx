"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Logo from "@/components/ui/logo";
import { useAppDispatch } from "@/store/hooks";
import { setUserInfo } from "@/store/slices/userSlice";

export default function Home() {
    const [selectedMethod, setSelectedMethod] = useState<"email" | "phone" | "wallet" | null>(null);
    const { ready, authenticated, user, login, logout } = usePrivy();
    console.log("ready, authenticated,user,", ready, authenticated, user);
    const router = useRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (authenticated && user) {
            const smartWallet = user.linkedAccounts.find((account) => account.type === "smart_wallet");
            dispatch(
                setUserInfo({
                    walletAddress: user.wallet?.address || null,
                    smartWalletAddress: smartWallet?.address || null,
                    smartWalletType: smartWallet?.type || null,
                    username: (user.email as unknown as string) || (user.phone as unknown as string) || user.wallet?.address || null,
                    isLoggedIn: true,
                })
            );
            router.push("/pod");
        }
    }, [authenticated, user, dispatch, router]);

    const handleConnect = async () => {
        setSelectedMethod("wallet");
        await login();
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
                <Logo />

                <p className="text-xl text-center mb-12">Connect onchain to a world of decentralized applications.</p>

                <div className="w-full space-y-4">
                    <button
                        className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${
                            selectedMethod === "wallet" ? "bg-[#7C3AED]" : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                        }`}
                        onClick={handleConnect}
                    >
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
