"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from "@/lib/config";
import { createContext, ReactNode, useState } from "react";
import { WagmiProvider } from 'wagmi'


export const MEETING_ID_REGEX = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

type AppContextType = {
    newMeeting: boolean;
    setNewMeeting: (newMeeting: boolean) => void;
};

type AppProviderProps = {
    children: ReactNode;
};

const initialContext: AppContextType = {
    newMeeting: false,
    setNewMeeting: () => null,
};

export const AppContext = createContext<AppContextType>(initialContext);
const queryClient = new QueryClient()


const AppProvider = ({ children }: AppProviderProps) => {
    const [newMeeting, setNewMeeting] = useState(false);
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
            <AppContext.Provider
                value={{
                    newMeeting,
                    setNewMeeting,
                }}
            >
                {children}
            </AppContext.Provider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default AppProvider;
