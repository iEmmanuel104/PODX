"use client";

import { useEffect } from "react";
import { PrivyProvider as Provider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { base, baseGoerli, mainnet, sepolia, polygon, polygonMumbai } from "viem/chains";
import { PRIVY_APP_ID } from "@/constants";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setSignature } from "@/store/slices/userSlice";
// import { initializeSocketConnection } from "@/lib/connections/socket";

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedSignature = localStorage.getItem("signature");

        if (storedUser && storedSignature) {
            const parsedUser = JSON.parse(storedUser);
            dispatch(setUser(parsedUser));
            dispatch(setSignature(storedSignature));
            // initializeSocketConnection(storedSignature);
        }
    }, [dispatch]);

    return (
        <Provider
            appId={PRIVY_APP_ID}
            config={{
                // Customize Privy's appearance in your app
                appearance: {
                    walletList: ["coinbase_wallet", "metamask", "rainbow", "wallet_connect"],
                    theme: "#121212",
                    accentColor: "#6032F6",
                    logo: "https://res.cloudinary.com/dmisafxa2/image/upload/v1729448381/PodX_Logo_uren7q.png",
                },
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    createOnLogin: "users-without-wallets",
                    noPromptOnSignature: false,
                },
                externalWallets: {
                    coinbaseWallet: {
                        connectionOptions: "smartWalletOnly",
                    },
                },
                defaultChain: base,
                loginMethods: ["email", "wallet"],
                supportedChains: [base, mainnet, sepolia, baseGoerli, polygon, polygonMumbai],
                fundingMethodConfig: {
                    moonpay: {
                        useSandbox: true,
                        paymentMethod: "credit_debit_card",
                        uiConfig: {
                            accentColor: "#6032F6",
                            theme: "dark",
                        },
                    },
                },
            }}
        >
            <SmartWalletsProvider>{children}</SmartWalletsProvider>
        </Provider>
    );
}
