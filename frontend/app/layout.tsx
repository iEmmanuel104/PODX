import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import StoreProvider from "@/providers/storeProvider";
import PrivyProvider from "@/providers/privyProvider";
import AppProvider from "@/providers/appProvider";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import "./globals.css";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
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
                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                    <StoreProvider>
                        <PrivyProvider>{children}</PrivyProvider>
                    </StoreProvider>
                </body>
            </html>
        </AppProvider>
    );
}
