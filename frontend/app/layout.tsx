import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import StoreProvider from "@/providers/storeProvider";
import PrivyProvider from "@/providers/privyProvider";
import AppProvider from "@/providers/appProvider";
import AuthProvider from "@/providers/authProvider";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import { Toaster } from "react-hot-toast";
import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";

const clashGroteskRegular = localFont({
    src: "./fonts/ClashGrotesk-Regular.woff",
    variable: "--font-clashgrotesk-sans",
    weight: "100 900",
});
const clashgroteskMedium = localFont({
    src: "./fonts/ClashGrotesk-Medium.woff",
    variable: "--font-clashgrotesk-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "Pod X",
    description: "Real-time meetings by Podx on chain Using your browser, share your video, desktop.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            <html lang="en">
                <body className={`${clashGroteskRegular.variable} ${clashgroteskMedium.variable} antialiased`}>
                    <StoreProvider>
                        <PrivyProvider>
                            <AuthProvider>
                                {children}
                                <Toaster
                                    position="bottom-right"
                                    toastOptions={{
                                        success: {
                                            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
                                            style: {
                                                background: "#1E1E1E",
                                                color: "#FFFFFF",
                                                border: "1px solid #22C55E",
                                            },
                                        },
                                        error: {
                                            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                                            style: {
                                                background: "#1E1E1E",
                                                color: "#FFFFFF",
                                                border: "1px solid #EF4444",
                                            },
                                        },
                                        loading: {
                                            icon: <DollarSign className="w-5 h-5 text-yellow-500 animate-pulse" />,
                                            style: {
                                                background: "#1E1E1E",
                                                color: "#FFFFFF",
                                                border: "1px solid #EAB308",
                                            },
                                        },
                                    }}
                                />
                            </AuthProvider>
                        </PrivyProvider>
                    </StoreProvider>
                </body>
            </html>
        </AppProvider>
    );
}
