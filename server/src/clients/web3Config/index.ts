// web3Client.ts
import { ethers } from 'ethers';
import { POAPContract, ICreateSessionParams, IBatchMintParams, SessionDetails } from './interface';
import {
    getContractInstance,
    getWalletSigner,
    initializeContracts,
} from './contracts';
import { logger } from '../../utils/logger';
import { PRIVATE_KEY } from './abis';
import { BadRequestError, InternalServerError } from '../../utils/customErrors';
import { handleWeb3Error } from './errorHandler';

class POAPWeb3Client {
    private static wallet: ethers.Wallet | null = null;
    private static contractWithSigner: POAPContract | null = null;

    static async initialize() {
        try {
            // Initialize contracts first
            await initializeContracts();

            // Initialize wallet
            this.wallet = await getWalletSigner(PRIVATE_KEY);

            // Initialize contract with signer
            this.contractWithSigner = getContractInstance(this.wallet);

            logger.info('POAP Web3 client initialized successfully with address:', this.wallet.address);

        } catch (error) {
            logger.error('Failed to initialize POAP Web3 client:', error);
            handleWeb3Error(error);
        }
    }

    static async createSession({
        sessionName,
        tokenURI,
        sessionId,
    }: ICreateSessionParams): Promise<string> {
        try {
            if (!this.contractWithSigner) {
                throw new InternalServerError('POAP contract not initialized');
            }

            const tx = await this.contractWithSigner.createSession(
                sessionName,
                tokenURI,
                sessionId
            );

            const receipt = await tx.wait(1);
            if (!receipt) {
                throw new InternalServerError('Transaction receipt not found');
            }

            logger.info(`Session created successfully with ID: ${sessionId}`);
            return tx.hash;

        } catch (error) {
            logger.error('Error creating session:', error);
            handleWeb3Error(error);
        }
    }

    static async batchMintTokens({
        recipients,
        sessionId,
    }: IBatchMintParams): Promise<string> {
        try {
            if (!this.contractWithSigner) {
                throw new InternalServerError('POAP contract not initialized');
            }

            const tx = await this.contractWithSigner.batchMintTokens(
                recipients,
                sessionId
            );

            const receipt = await tx.wait(1);
            if (!receipt) {
                throw new InternalServerError('Transaction receipt not found');
            }

            logger.info(`Batch minted tokens for session ${sessionId} to ${recipients.length} recipients`);
            return tx.hash;

        } catch (error) {
            logger.error('Error batch minting tokens:', error);
            handleWeb3Error(error);
        }
    }

    static async getSessionDetails(sessionId: number): Promise<SessionDetails> {
        try {
            if (!this.contractWithSigner) {
                throw new InternalServerError('POAP contract not initialized');
            }
            const [name, tokenURI, exists] = await this.contractWithSigner.getSessionDetails(sessionId);
            return { name, tokenURI, exists };
        } catch (error) {
            logger.error('Error getting session details:', error);
            throw error;
        }
    }

    static async hasReceivedToken(sessionId: number, recipient: string): Promise<boolean> {
        try {
            if (!this.contractWithSigner) {
                throw new InternalServerError('POAP contract not initialized');
            }
            return await this.contractWithSigner.hasReceivedTokenForSession(sessionId, recipient);
        } catch (error) {
            logger.error('Error checking token receipt:', error);
            throw error;
        }
    }
}

// Retry configuration for initialization
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

export async function initializePOAPWeb3(attempt: number = 1): Promise<void> {
    try {
        await POAPWeb3Client.initialize();
    } catch (error) {
        logger.error(`Failed to initialize POAP Web3 client (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`, error);

        if (attempt < MAX_RETRY_ATTEMPTS) {
            logger.info(`Retrying POAP Web3 initialization in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            await initializePOAPWeb3(attempt + 1);
        } else {
            throw new BadRequestError('Failed to initialize POAP Web3 client after maximum retry attempts');
        }
    }
}

export default POAPWeb3Client;