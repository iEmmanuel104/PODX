import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export function getConfig() {
    return createConfig({
        chains: [base, baseSepolia],
        connectors: [
            injected(),
            coinbaseWallet({
                appName: 'Create Wagmi',
                preference: 'smartWalletOnly',
            }),
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [base.id]: http(),
            [baseSepolia.id]: http(),
        },
    });
}

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>;
    }
}