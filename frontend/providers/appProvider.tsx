'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';

type AppProviderProps = {
    children: ReactNode;
};

const queryClient = new QueryClient();

const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
};

export default AppProvider;
