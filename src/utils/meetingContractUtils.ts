/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPublicClient, http, decodeEventLog } from "viem";
import { baseSepolia } from "viem/chains";
import {
    toCoinbaseSmartAccount,
    createBundlerClient,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import meetingFactoryMetadata from "../contracts/artifacts/MeetingFactory_metadata.json";
import meetingMetadata from "../contracts/artifacts/Meeting_metadata.json";
import { logger } from "./logger";
import { Hex } from "./types";

// Load environment variables first
config();

type EstimateGasResult = {
    preVerificationGas: bigint;
    verificationGasLimit: bigint;
    callGasLimit: bigint;
};

// Get environment variables and RPC URL
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as Hex;
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith("0x")
    ? (process.env.PRIVATE_KEY as Hex)
    : `0x${process.env.PRIVATE_KEY}`;
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const RPC_URL = `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${COINBASE_API_KEY}`;

// Log environment variables for debugging
logger.info("\nEnvironment Variables:");
logger.info("FACTORY_ADDRESS:", FACTORY_ADDRESS);
logger.info("PRIVATE_KEY:", PRIVATE_KEY ? "✅ Set" : "❌ Missing");
logger.info("COINBASE_API_KEY:", COINBASE_API_KEY ? "✅ Set" : "❌ Missing");
logger.info("RPC_URL:", RPC_URL);

if (!FACTORY_ADDRESS || !PRIVATE_KEY || !COINBASE_API_KEY) {
    throw new Error(
        "Missing required environment variables. Please check FACTORY_ADDRESS, PRIVATE_KEY, and COINBASE_API_KEY",
    );
}

// Create public client
const client = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
});

// Create owner account from private key
const owner = privateKeyToAccount(PRIVATE_KEY as Hex);

// Create smart account and bundler client
const getClients = async (): Promise<{ account: any; bundlerClient: any }> => {
    try {
        // Create Coinbase smart wallet using an EOA signer
        const account = await toCoinbaseSmartAccount({
            client,
            owners: [owner],
        });

        // Log the deterministic public address
        logger.info(`Using smart account address: ${account.address}`);

        // The bundler is a special node that gets your UserOperation on chain
        const bundlerClient = createBundlerClient({
            account,
            client,
            transport: http(RPC_URL),
            chain: baseSepolia,
        });

        // Pads the preVerificationGas to ensure UserOperation lands onchain
        account.userOperation = {
            estimateGas: async (userOperation): Promise<EstimateGasResult> => {
                const estimate = await bundlerClient.estimateUserOperationGas({
                    ...userOperation,
                    callData: userOperation.callData || "0x",
                    callGasLimit: userOperation.callGasLimit || 0n,
                    maxFeePerGas: userOperation.maxFeePerGas || 0n,
                    maxPriorityFeePerGas:
                        userOperation.maxPriorityFeePerGas || 0n,
                });
                // adjust preVerification upward
                estimate.preVerificationGas = estimate.preVerificationGas * 2n;
                return estimate;
            },
        };

        return { account, bundlerClient };
    } catch (error) {
        logger.error("Error creating clients:", error);
        throw error;
    }
};

interface CreateMeetingParams {
    sessionName: string;
    metadataURL: string;
    creator: Hex;
    minters: Hex[];
}

interface MintTokenParams {
    meetingAddress: Hex;
    recipient: Hex;
    metadataURI: string;
}

interface DeployAndMintParams {
    sessionName: string;
    metadataURL: string;
    creator: Hex;
    minters: Hex[];
    recipientAddress: Hex;
}

/**
 * Utility class for Meeting contract interactions using Coinbase Paymaster
 */
export class MeetingContractUtils {
    static getClients = getClients;

    /**
     * Deploy a meeting contract and mint a token in one operation
     * @param params Combined parameters for deployment and minting
     * @returns Object containing deployment and minting transaction details
     */
    static async deployAndMint(params: DeployAndMintParams): Promise<{
        meetingAddress?: Hex;
        mintTxHash?: Hex;
        success: boolean;
        error?: string;
    }> {
        try {
            const {
                sessionName,
                metadataURL,
                creator,
                minters,
                recipientAddress,
            } = params;
            const { account } = await getClients();
            const smartAccountAddress = account.address;

            logger.info("\n🚀 Starting Deploy & Mint Operation");
            logger.info("Smart Account:", smartAccountAddress);
            logger.info("\n📝 Parameters:");
            logger.info("Session Name:", sessionName);
            logger.info("Metadata URL:", metadataURL);
            logger.info("Creator:", creator);
            logger.info("Minters:", minters);
            logger.info("Recipient:", recipientAddress);

            // First deploy the contract
            const { meetingAddress } = await this.deployMeeting({
                sessionName,
                metadataURL,
                creator,
                minters: [...minters, smartAccountAddress], // Ensure smart account can mint
            });

            if (!meetingAddress) {
                throw new Error(
                    "Meeting contract deployment failed: No meeting address returned",
                );
            }

            logger.info("\n🏗️ Contract Deployed Successfully");
            logger.info("Meeting Address:", meetingAddress);

            // Then mint the token
            const mintTxHash = await this.mintToken({
                meetingAddress,
                recipient: recipientAddress,
                metadataURI: metadataURL,
            });

            logger.info("\n🎉 Operation Complete!");
            logger.info("Contract:", meetingAddress);
            logger.info("Mint Transaction:", mintTxHash);

            return {
                meetingAddress,
                mintTxHash,
                success: true,
            };
        } catch (error) {
            logger.error("Deploy and mint operation failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Deploy a new Meeting contract through the factory
     * @param params Meeting creation parameters
     * @returns Transaction receipt containing deployment logs
     */
    static async deployMeeting(
        params: CreateMeetingParams,
    ): Promise<{ meetingAddress: Hex; receipt: any }> {
        try {
            const { sessionName, metadataURL, creator, minters } = params;
            const { account, bundlerClient } = await getClients();

            logger.info("\n📝 Deployment Parameters:");
            logger.info("Session Name:", sessionName);
            logger.info("Metadata URL:", metadataURL);
            logger.info("Creator:", creator);
            logger.info("Minters:", minters);

            // Prepare the contract call
            const createMeetingCall = {
                abi: meetingFactoryMetadata.output.abi,
                functionName: "createMeeting",
                to: FACTORY_ADDRESS,
                args: [sessionName, metadataURL, creator, minters],
            };

            // Sign and send the UserOperation
            const userOpHash = await bundlerClient.sendUserOperation({
                account,
                calls: [createMeetingCall],
                paymaster: true,
            });

            // Wait for receipt and get transaction hash
            const receipt = await bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash,
            });

            // Find and decode the MeetingCreated event
            const meetingCreatedEvent = receipt.receipt.logs.find(
                (log: any) => {
                    try {
                        const event = decodeEventLog({
                            abi: meetingFactoryMetadata.output.abi,
                            data: log.data,
                            topics: log.topics,
                        });
                        return event.eventName === "MeetingCreated";
                    } catch {
                        return false;
                    }
                },
            );

            if (!meetingCreatedEvent) {
                throw new Error(
                    "Meeting contract deployment failed: MeetingCreated event not found in logs",
                );
            }

            // Decode the event to get the meeting address
            const decodedEvent = decodeEventLog({
                abi: meetingFactoryMetadata.output.abi,
                data: meetingCreatedEvent.data,
                topics: meetingCreatedEvent.topics,
            });

            const meetingAddress = (decodedEvent.args as any)
                .meetingAddress as Hex;

            logger.info("\n✅ Meeting Contract Deployment Success!");
            logger.info("📍 Meeting Contract Address:", meetingAddress);
            logger.info(
                `⛽ View sponsored UserOperation: https://base-sepolia.blockscout.com/op/${receipt.userOpHash}`,
            );
            logger.info(
                `🔍 View transaction: https://sepolia.basescan.org/tx/${receipt.receipt.transactionHash}`,
            );

            return {
                meetingAddress,
                receipt: receipt.receipt,
            };
        } catch (error) {
            logger.error("Meeting deployment error:", error);
            throw error;
        }
    }

    /**
     * Mint a token for a specific meeting
     * @param params Token minting parameters
     * @returns Transaction hash
     */
    static async mintToken(params: MintTokenParams): Promise<Hex> {
        try {
            const { meetingAddress, recipient, metadataURI } = params;
            const { account, bundlerClient } = await getClients();

            logger.info("\n🎫 Minting Parameters:");
            logger.info("Meeting Contract:", meetingAddress);
            logger.info("Recipient:", recipient);
            logger.info("Metadata URI:", metadataURI);

            // Prepare the mint call
            const mintCall = {
                abi: meetingMetadata.output.abi,
                functionName: "mint",
                to: meetingAddress,
                args: [recipient, metadataURI],
            };

            // Sign and send the UserOperation
            const userOpHash = await bundlerClient.sendUserOperation({
                account,
                calls: [mintCall],
                paymaster: true,
            });

            // Wait for receipt
            const receipt = await bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash,
            });

            logger.info("\n✅ Token Mint Success!");
            logger.info("🏠 Meeting Contract:", meetingAddress);
            logger.info("📬 Recipient:", recipient);
            logger.info(
                `⛽ View sponsored UserOperation: https://base-sepolia.blockscout.com/op/${receipt.userOpHash}`,
            );
            logger.info(
                `🔍 View NFT: https://sepolia.basescan.org/token/${meetingAddress}`,
            );

            return receipt.receipt.transactionHash;
        } catch (error) {
            logger.error("Token minting error:", error);
            throw error;
        }
    }
}
