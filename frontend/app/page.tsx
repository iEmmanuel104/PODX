"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import Logo from "@/components/ui/logo";
import { useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/slices/userSlice";

export default function Home() {
    const dispatch = useAppDispatch();
    const [isConnecting, setIsConnecting] = useState(false);
    const { login, logout} = usePrivy();

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await logout(); // Log out of existing privy session
            dispatch(logOut()); // clear user data from store
            await login();
        } catch (error) {
            console.error("Error connecting wallet:", error);
            // Handle error (e.g., show error message to user)
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
                <Logo />

                <p className="text-xl text-center mb-12">Connect onchain to a world of decentralized applications.</p>

                <div className="w-full space-y-4">
                    <button
                        className="w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors bg-[#6032f6] hover:bg-[#3C3C3C] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5 mr-2" />
                                Connect
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
