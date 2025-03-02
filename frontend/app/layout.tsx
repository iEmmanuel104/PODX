import type { Metadata, Viewport } from 'next';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './globals.css';
import StoreProvider from '@/providers/storeProvider';
import PrivyProvider from '@/providers/privyProvider';
import AppProvider from '@/providers/appProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'stream-chat-react/dist/css/v2/index.css';
import { Toaster } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { clashGrotesk } from '@/constants';

const APP_NAME = 'Pod X';
const APP_DESCRIPTION =
    'Real-time meetings by Podx on chain Using your browser, share your video, desktop.';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.podx.fun';

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL), // Add metadataBase
    title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    applicationName: APP_NAME,
    authors: [{ name: APP_NAME, url: BASE_URL }],
    generator: 'Next.js',
    keywords: [
        'Pod X',
        'blockchain meetings',
        'web3 video calls',
        'decentralized communication',
        'crypto video conferencing',
        'on-chain meetings',
        'blockchain video platform',
        'web3 collaboration',
    ],
    referrer: 'origin-when-cross-origin',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: BASE_URL,
        title: {
            default: APP_NAME,
            template: `%s | ${APP_NAME}`,
        },
        description: APP_DESCRIPTION,
        siteName: APP_NAME,
        images: [
            {
                url: `/OG.png`,
                width: 1200,
                height: 630,
                alt: 'Pod X - Collaborate Like Web2, Own Like Web3',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: APP_NAME,
        description: APP_DESCRIPTION,
        images: [`/OG.png`],
        creator: '@podx',
        site: '@podx',
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/icon.png', type: 'image/png', sizes: '32x32' },
            { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
            { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
        ],
        apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
        other: [
            {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#1E1E1E',
            },
        ],
    },
    manifest: '/manifest.json',
    alternates: {
        canonical: BASE_URL,
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    category: 'technology',
    classification: 'video conferencing',
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#1E1E1E' },
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    ],
    colorScheme: 'dark',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            <html lang="en">
                <body className={`${clashGrotesk.className} antialiased`}>
                    <StoreProvider>
                        <PrivyProvider>
                            {children}
                            <Toaster
                                position="bottom-right"
                                toastOptions={{
                                    success: {
                                        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
                                        style: {
                                            background: '#1E1E1E',
                                            color: '#FFFFFF',
                                            border: '1px solid #22C55E',
                                        },
                                    },
                                    error: {
                                        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                                        style: {
                                            background: '#1E1E1E',
                                            color: '#FFFFFF',
                                            border: '1px solid #EF4444',
                                        },
                                    },
                                    loading: {
                                        icon: (
                                            <DollarSign className="w-5 h-5 text-[#DDB958] animate-pulse" />
                                        ),
                                        style: {
                                            background: '#1E1E1E',
                                            color: '#FFFFFF',
                                            border: '1px solid #EAB308',
                                        },
                                    },
                                }}
                            />
                            <SpeedInsights />
                        </PrivyProvider>
                    </StoreProvider>
                </body>
            </html>
        </AppProvider>
    );
}