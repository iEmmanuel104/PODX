/* eslint-disable @typescript-eslint/no-explicit-any */
// services/metadata.service.ts
import { PinataSDK } from 'pinata-web3';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export class MetadataService {
    private static pinata: PinataSDK | null = null;
    private static isInitialized = false;
    private static initializationPromise: Promise<void> | null = null;

    private static readonly BASE_IMAGES = [
        '/images/poap/base1.png',
        '/images/poap/base2.png',
        '/images/poap/base3.png',
    ];

    private static async ensureInitialized(): Promise<void> {
        if (this.isInitialized) return;

        // If initialization is in progress, wait for it
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }

        // Start initialization
        this.initializationPromise = this.initializeService();
        await this.initializationPromise;
    }

    private static async initializeService(): Promise<void> {
        try {
            const { PINATA_JWT, PINATA_GATEWAY } = process.env;

            if (!PINATA_JWT || !PINATA_GATEWAY) {
                throw new Error('Missing required Pinata configuration');
            }

            this.pinata = new PinataSDK({
                pinataJwt: PINATA_JWT,
                pinataGateway: PINATA_GATEWAY,
            });

            // Verify Pinata connection
            await this.testPinataConnection();

            // Verify base images exist
            await this.verifyBaseImages();

            this.isInitialized = true;
            logger.info('MetadataService initialized successfully');

        } catch (error) {
            this.isInitialized = false;
            this.pinata = null;
            this.initializationPromise = null;
            logger.error('Failed to initialize MetadataService:', error);
            throw error;
        }
    }

    private static async testPinataConnection(): Promise<void> {
        try {
            if (!this.pinata) throw new Error('Pinata client not initialized');

            // Test the connection by trying to get account info
            const auth = await this.pinata.testAuthentication();
            console.log('Pinata account info:', auth);
        } catch (error) {
            throw new Error(`Failed to connect to Pinata: ${error}`);
        }
    }

    private static async verifyBaseImages(): Promise<void> {
        for (const imagePath of this.BASE_IMAGES) {
            try {
                await fs.promises.access(imagePath, fs.constants.R_OK);
            } catch (error) {
                console.log(error);
                throw new Error(`Base image not accessible: ${imagePath}`);
            }
        }
    }

    static async generateAndUploadMetadata(
        call: any,
        user: any,
        sessionId: number
    ): Promise<{ metadataUri: string; imageVariant: number }> {
        await this.ensureInitialized();

        try {
            // Select random base image
            const imageVariant = Math.floor(Math.random() * this.BASE_IMAGES.length);
            const baseImagePath = this.BASE_IMAGES[imageVariant];

            // Read the base image file
            const imageBuffer = await fs.promises.readFile(baseImagePath);

            // Upload base image to IPFS
            const imageFile = new File(
                [imageBuffer],
                `PODX_${sessionId}_${user._id}.png`,
                { type: 'image/png' }
            );

            if (!this.pinata) throw new Error('Pinata client not initialized');
            const imageUpload = await this.pinata.upload.file(imageFile);

            // Generate unique seed for metadata
            const uniqueSeed = `${user._id}-${sessionId}-${Date.now()}`;
            const uniqueId = Buffer.from(uniqueSeed).toString('hex').slice(0, 8);

            // Create metadata with unique identifiers
            const metadata = {
                name: `PODX Call #${call.callId} - Attendee ${uniqueId}`,
                description: `Proof of attendance for PODX call participation.\nCall Duration: ${Math.floor(call.duration / 60)} minutes\nParticipants: ${call.members.length}`,
                image: `ipfs://${imageUpload.IpfsHash}`,
                attributes: [
                    {
                        trait_type: 'Call Duration',
                        value: Math.floor(call.duration / 60),
                    },
                    {
                        trait_type: 'Participant Count',
                        value: call.members.length,
                    },
                    {
                        trait_type: 'Date',
                        value: call.endTime.toISOString().split('T')[0],
                    },
                    {
                        trait_type: 'POAP Type',
                        value: `Version ${imageVariant + 1}`,
                    },
                    {
                        trait_type: 'Unique Identifier',
                        value: uniqueId,
                    },
                    {
                        trait_type: 'Call Category',
                        value: call.custom?.category || 'General',
                    },
                ],
                properties: {
                    sessionId: sessionId.toString(),
                    callId: call.callId,
                    attendeeId: user._id.toString(),
                    mintTimestamp: new Date().toISOString(),
                },
            };

            // Upload metadata
            const metadataBlob = new Blob(
                [JSON.stringify(metadata, null, 2)],
                { type: 'application/json' }
            );
            const metadataFile = new File(
                [metadataBlob],
                `PODX_${sessionId}_${user._id}_metadata.json`
            );
            const metadataUpload = await this.pinata.upload.file(metadataFile);

            return {
                metadataUri: `ipfs://${metadataUpload.IpfsHash}`,
                imageVariant,
            };
        } catch (error) {
            logger.error('Error generating metadata:', error);
            throw error;
        }
    }

    static async getExistingMetadata(metadataUri: string): Promise<any> {
        await this.ensureInitialized();

        try {
            if (!this.pinata) throw new Error('Pinata client not initialized');
            const ipfsHash = metadataUri.replace('ipfs://', '');
            return await this.pinata.gateways.get(ipfsHash);
        } catch (error) {
            logger.error('Error fetching existing metadata:', error);
            throw error;
        }
    }

    // Method to force re-initialization if needed (e.g., for testing)
    static async reinitialize(): Promise<void> {
        this.isInitialized = false;
        this.pinata = null;
        this.initializationPromise = null;
        await this.ensureInitialized();
    }
}