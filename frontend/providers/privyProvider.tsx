"use client";

import { useEffect } from "react";
import { PrivyProvider as Provider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { base, baseGoerli, mainnet, sepolia, polygon, polygonMumbai } from "viem/chains";
import { PRIVY_APP_ID } from "@/constants";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setSignature } from "@/store/slices/userSlice";
import { initializeSocketConnection } from "@/lib/connections/socket";

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedSignature = localStorage.getItem("signature");

        if (storedUser && storedSignature) {
            const parsedUser = JSON.parse(storedUser);
            dispatch(setUser(parsedUser));
            dispatch(setSignature(storedSignature));
            initializeSocketConnection(storedSignature);
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
                    logo: "https://res.cloudinary.com/drc6omjqc/image/upload/v1728435415/Frame_2_ykhxfe.png",
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
                loginMethods: ["wallet", "email"],
                supportedChains: [mainnet, sepolia, base, baseGoerli, polygon, polygonMumbai],
            }}
        >
            <SmartWalletsProvider>{children}</SmartWalletsProvider>
        </Provider>
    );
}
