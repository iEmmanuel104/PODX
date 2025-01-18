"use client";

import { useCallback, useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/slices/userSlice";
import localFont from "next/font/local";
import dynamic from "next/dynamic";

// Dynamically import components that aren't needed for initial render
const Logo = dynamic(() => import("@/public/images/icons/Logo"), {
    loading: () => <div className="w-[174px] h-[43px] animate-pulse bg-gray-700" />,
});

const Footer = dynamic(() => import("@/components/common/Footer"));
const RetroGrid = dynamic(() => import("@/components/ui/retro-grid"));

const balige = localFont({
    src: "../fonts/Balige - Personal Use.otf",
    variable: "--font-balige",
    preload: true,
    display: "swap",
});

export default function LandingPage() {
    const dispatch = useAppDispatch();
    const { login, logout, ready } = usePrivy();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (ready) {
            setIsLoading(false);
        }
    }, [ready]);

    const handleConnect = useCallback(async () => {
        try {
            setIsLoading(true);
            await logout();
            dispatch(logOut());
            await login();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        } finally {
            setIsLoading(false);
        }
    }, [logout, dispatch, login]);

    if (!ready) return null;

    return (
        <main className={`bg-[#212121] text-white flex flex-col items-center justify-center p-4 ${balige.variable}`}>
            <div className="container mx-auto">
                <div className="flex flex-col gap-[300px]">
                    <div className="max-w-[665px] flex flex-col justify-center items-center gap-[130px]">
                        <div className="w-[174px] h-[43px]">
                            <Logo />
                        </div>
                        <div className="flex flex-col gap-[68px]">
                            <div className="flex flex-col justify-center items-center gap-[24px]">
                                <div className="flex justify-center items-center rounded-full bg-gradient-to-r from-[#552FC9] to-[#D7B35D] p-[1px]">
                                    <span className="rounded-full bg-[#212121] text-white text-xs uppercase tracking-wider py-1 px-4">
                                        A creator's workspace
                                    </span>
                                </div>
                                <h1 className="text-4xl lg:text-[36px] text-center font-balige lg:leading-[45px] text-gray-200">
                                    Host meetings, record sessions, earn proof of attendance, and{" "}
                                    <span className="inline-block">
                                        <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text">tip</span>
                                    </span>{" "}
                                    seamlessly
                                </h1>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    className="py-2 px-8 rounded-[10px] bg-[#6032F6] hover:bg-[#4C28C4] transition-colors text-white font-medium text-lg"
                                    onClick={handleConnect}
                                >
                                    Get started
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <RetroGrid />
        </main>
    );
}
