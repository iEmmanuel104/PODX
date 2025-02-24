'use client';
import * as React from 'react';
import { memo } from 'react';
import Image from 'next/image';
import Telegram from '@/public/images/icons/socials/Telegram';
import X from '@/public/images/icons/socials/X';
import localFont from 'next/font/local';

// Preload and cache the font
const mortendBold = localFont({
    src: '../../app/fonts/mortendbold.otf',
    variable: '--font-mortend',
    weight: '600',
    preload: true,
    display: 'swap'
});

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
    text?: string;
}

// Memoize social links to prevent re-renders
const SocialLinks = memo(() => (
    <div className="socials flex gap-[8px]">
        <a
            href="https://t.me/podx_fun"
            target="_blank"
            rel="noopener noreferrer"
            title="Join us on Telegram"
            className="social-icon h-[24px] w-[24px]"
        >
            <Telegram />
        </a>
        {/* <a href="#!" target="_blank" className="social-icon h-[24px] w-[24px]">
            <Facebook />
        </a> */}
        <a
            href="https://x.com/podx_fun"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow us on X"
            className="social-icon h-[24px] w-[24px]"
        >
            <X />
        </a>
    </div>
));
SocialLinks.displayName = 'SocialLinks';

// Memoize the entire LoadingOverlay component
const LoadingOverlay = memo(React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
    ({ className, text = 'Loading...', ...props }, ref) => (
        <div
            ref={ref}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#121212] bg-opacity-80 backdrop-blur-sm ${className}`}
            {...props}
        >
            <div className="container mx-auto">
                <div className="flex flex-col gap-[487px]">
                    <div className="flex flex-col gap-[76px] items-center">
                        <h2
                            className={`text-3xl font-black
                            text-transparent bg-clip-text bg-gradient-to-r from-[#D7B35D] via-white to-[#552FC9] bg-300% animate-podx-gradient ${mortendBold.variable}`}
                        >
                            PODX
                        </h2>
                        <p
                            className="text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-t from-[#6E6E6E] to-[#D4D4D4] animate-fade-in"
                            style={{ animationDelay: '0.2s' }}
                        >
                            {text}
                        </p>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text font-medium text-sm">
                            Podx @ {new Date().getFullYear()}
                        </span>
                        <SocialLinks />
                    </div>
                </div>
            </div>
        </div>
    )
));

LoadingOverlay.displayName = 'LoadingOverlay';

export { LoadingOverlay };
