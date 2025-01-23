import { Suspense } from "react";
import type { Metadata } from "next";
import AuthProvider from "@/providers/authProvider";
import localFont from "next/font/local";

const clashGroteskRegular = localFont({
    src: "../fonts/ClashGrotesk-Regular.woff",
    variable: "--font-clashgrotesk-sans",
    weight: "400",
    preload: true,
    display: 'swap'
});

const clashgroteskMedium = localFont({
    src: "../fonts/ClashGrotesk-Medium.woff",
    variable: "--font-clashgrotesk-mono",
    weight: "500",
    preload: true,
    display: 'swap'
});

export const metadata: Metadata = {
    title: "Pod X",
    description: "Real-time meetings by Podx on chain Using your browser, share your video, desktop.",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={`${clashGroteskRegular.variable} ${clashgroteskMedium.variable} antialiased bg-[#212121] min-h-screen flex justify-center items-center relative`}
        >
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
                <AuthProvider>{children}</AuthProvider>
            </Suspense>
        </div>
    );
}