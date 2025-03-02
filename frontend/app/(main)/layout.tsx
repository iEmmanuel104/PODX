import type { Metadata } from 'next';
import MainLayoutClient from './MainLayoutClient';

export const metadata: Metadata = {
    title: 'Pod X',
    description:
        'Real-time meetings by Podx on chain Using your browser, share your video, desktop.',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return <MainLayoutClient>{children}</MainLayoutClient>;
}
