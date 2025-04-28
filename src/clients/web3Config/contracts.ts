/* eslint-disable no-undef */
// contracts.ts
import { ethers } from "ethers";
import { POAPContract } from "./interface";
import { POAP_ABI, POAP_CONTRACT_ADDRESS, RPC_URL } from "./abis";
import { logger } from "../../utils/logger";
import { BadRequestError } from "../../utils/customErrors";

class ContractsManager {
    private static provider: ethers.JsonRpcProvider | null = null;
    private static poapContract: POAPContract | null = null;
    private static isInitialized: boolean = false;
    private static connectionCheckInterval: NodeJS.Timeout | null = null;
    private static reconnectTimeout: NodeJS.Timeout | null = null;
    private static lastBlockNumber: number = 0;
    private static consecutiveFailures: number = 0;
    private static readonly MAX_CONSECUTIVE_FAILURES = 3;

    static async initialize() {
        if (this.isInitialized) {
            return;
        }

        const maxRetries = 3;
        const retryDelay = 300000; // 5 minutes

        for (let i = 0; i < maxRetries; i++) {
            try {
                this.provider = new ethers.JsonRpcProvider(
                    RPC_URL,
                    {
                        chainId: 84532,
                        name: "base-sepolia",
                    },
                    {
                        // staticNetwork: true,
                        polling: true,
                        // pollingInterval: 4000, // 4 seconds
                        batchMaxCount: 1, // Limit concurrent requests
                        // cacheTimeout: 2000, // 2 seconds cache
                    },
                );

                // Test connection
                const network = await this.provider.getNetwork();
                this.lastBlockNumber = await this.provider.getBlockNumber();
                logger.info(
                    "Connected to network:",
                    network.name,
                    "at block:",
                    this.lastBlockNumber,
                );

                // Initialize POAP contrac
                this.poapContract = new ethers.Contract(
                    POAP_CONTRACT_ADDRESS,
                    POAP_ABI,
                    this.provider,
                ) as unknown as POAPContract;

                // Start connection monitoring
                this.startConnectionMonitoring();

                this.isInitialized = true;
                this.consecutiveFailures = 0;
                logger.info("Contracts manager initialized successfully");
                return;
            } catch (error) {
                logger.error(
                    `Provider initialization attempt ${i + 1} failed:`,
                    error,
                );
                if (i < maxRetries - 1) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, retryDelay),
                    );
                } else {
                    throw new BadRequestError(
                        "Failed to initialize provider after maximum retries",
                    );
                }
            }
        }
    }

    private static async isConnectionValid(): Promise<boolean> {
        try {
            if (!this.provider) return false;
            const currentBlockNumber = await this.provider.getBlockNumber();
            const isProgressingChain =
                currentBlockNumber >= this.lastBlockNumber;
            this.lastBlockNumber = currentBlockNumber;
            return isProgressingChain;
        } catch {
            return false;
        }
    }

    private static startConnectionMonitoring() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }

        this.connectionCheckInterval = setInterval(async () => {
            try {
                if (!(await this.isConnectionValid())) {
                    this.consecutiveFailures++;
                    logger.info(
                        `Connection check failed. Consecutive failures: ${this.consecutiveFailures}`,
                    );

                    if (
                        this.consecutiveFailures >=
                        this.MAX_CONSECUTIVE_FAILURES
                    ) {
                        void this.handleConnectionError();
                    }
                } else {
                    if (this.consecutiveFailures > 0) {
                        logger.info("Connection restored");
                    }
                    this.consecutiveFailures = 0;
                }
            } catch (error) {
                logger.error("Connection monitoring error:", error);
                this.consecutiveFailures++;
                if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
                    void this.handleConnectionError();
                }
            }
        }, 60000);
    }

    private static async handleConnectionError() {
        if (this.reconnectTimeout) return;

        logger.info("Connection unstable - initiating reconnection...");

        this.reconnectTimeout = setTimeout(async () => {
            try {
                this.cleanup(false);
                await this.initialize();
                this.reconnectTimeout = null;
            } catch (error) {
                logger.error("Reconnection failed:", error);
                this.reconnectTimeout = null;
                this.consecutiveFailures = 0;
            }
        }, 5000);
    }

    static getContractInstance(
        signerOrProvider?: ethers.Signer | ethers.Provider,
    ): POAPContract {
        this.ensureInitialized();
        const contract = this.poapContract;
        if (!contract) {
            throw new BadRequestError("POAP contract not initialized");
        }
        if (signerOrProvider) {
            return contract.connect(signerOrProvider) as POAPContract;
        }
        return contract;
    }

    static async getWalletSigner(privateKey: string): Promise<ethers.Wallet> {
        this.ensureInitialized();
        if (!this.provider) {
            throw new BadRequestError("Provider not initialized");
        }
        return new ethers.Wallet(privateKey, this.provider);
    }

    private static ensureInitialized() {
        if (!this.isInitialized) {
            throw new BadRequestError(
                "ContractsManager not initialized. Call initialize() first.",
            );
        }
    }

    static cleanup(shouldLog: boolean = true) {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.provider = null;
        this.poapContract = null;
        this.isInitialized = false;
        this.consecutiveFailures = 0;

        if (shouldLog) {
            logger.info("ContractsManager cleaned up");
        }
    }
}

export const initializeContracts =
    ContractsManager.initialize.bind(ContractsManager);
export const getContractInstance =
    ContractsManager.getContractInstance.bind(ContractsManager);
export const getWalletSigner =
    ContractsManager.getWalletSigner.bind(ContractsManager);
export const cleanup = ContractsManager.cleanup.bind(ContractsManager);
