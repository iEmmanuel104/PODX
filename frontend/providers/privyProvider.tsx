"use client";

import { PrivyProvider as Provider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import {base, baseGoerli, mainnet, sepolia, polygon, polygonMumbai} from 'viem/chains';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                // Customize Privy's appearance in your app
                appearance: {
                    // walletList: ["coinbase_wallet",  ],
                    theme: "dark",
                    accentColor: "#6032F6",
                    logo: "https://res.cloudinary.com/dxzwbed3z/image/upload/v1720793570/c1cnd8dmyleekqmdw7rf.png",
                },
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    createOnLogin: "users-without-wallets",
                },
                externalWallets: {
                    coinbaseWallet: {
                        connectionOptions: "smartWalletOnly",
                    },
                },
                defaultChain: base,
                supportedChains: [mainnet, sepolia, base, baseGoerli, polygon, polygonMumbai] 
            }}
        >
            <SmartWalletsProvider>{children}</SmartWalletsProvider>
        </Provider>
    );
}
