/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { logger } from "../utils/logger";
import FormData from "form-data";

export interface NFTMetadataInput {
    name: string;
    description: string;
    image: Buffer | null;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    callDetails?: {
        title: string;
        type: string;
        creator: string;
        createdAt: string;
        roomId?: string;
        callCode?: string;
        [key: string]: any;
    };
}

export interface NFTMetadataOutput {
    metadataUri: string | null;
    error: string | null;
}

export class PinataService {
    private static API_KEY = process.env.PINATA_API_KEY;
    private static API_SECRET = process.env.PINATA_API_SECRET;
    private static JWT = process.env.PINATA_JWT;
    private static BASE_URL = "https://api.pinata.cloud";

    static async createNFTMetadata(
        input: NFTMetadataInput,
    ): Promise<NFTMetadataOutput> {
        try {
            // Prepare display name for metadata
            const displayName = input.callDetails?.callCode
                ? `${input.name}-${input.callDetails.callCode}`
                : input.name;

            // Common key-values for Pinata metadata
            const commonKeyValues = {
                type: input.image ? "call-image" : "call-metadata",
                title: input.name,
                creator: input.callDetails?.creator || "",
                callType: input.callDetails?.callType || "",
                roomId: input.callDetails?.roomId || "",
                timestamp: new Date().toISOString(),
            };

            // Connection timeout for Pinata requests
            const config = {
                headers: {
                    Authorization: `Bearer ${this.JWT}`,
                },
                timeout: 15000, // 15 second timeout - reduced from 30s
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };

            // If we have an image, handle it separately for performance
            if (input.image) {
                const formData = new FormData();

                // Add the image as a buffer to FormData
                formData.append("file", input.image, {
                    filename: `${displayName}.png`,
                    contentType: "image/png",
                });

                // Add Pinata metadata
                formData.append(
                    "pinataMetadata",
                    JSON.stringify({
                        name: displayName,
                        keyvalues: commonKeyValues,
                    }),
                );

                // Upload with optimized configuration
                const response = await axios.post(
                    "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    formData,
                    {
                        ...config,
                        headers: {
                            ...config.headers,
                            ...formData.getHeaders(),
                        },
                    },
                );

                return {
                    metadataUri: `ipfs://${response.data.IpfsHash}`,
                    error: null,
                };
            }

            // Metadata-only upload (no image)
            // Simplified metadata structure for faster uploads
            const metadataContent = {
                name: displayName,
                description: input.description,
                attributes: input.attributes || [],
                callDetails: input.callDetails || {},
                external_url: input.callDetails?.roomId
                    ? `${process.env.FRONTEND_URL || "https://app.podx.xyz"}/calls/${input.callDetails.roomId}`
                    : undefined,
                background_color: "000000",
                timestamp: new Date().toISOString(),
            };

            // Upload JSON with optimized configuration
            const response = await axios.post(
                "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                {
                    pinataContent: metadataContent,
                    pinataMetadata: {
                        name: displayName,
                        keyvalues: commonKeyValues,
                    },
                    pinataOptions: {
                        cidVersion: 1,
                    },
                },
                {
                    ...config,
                    headers: {
                        ...config.headers,
                        "Content-Type": "application/json",
                    },
                },
            );

            return {
                metadataUri: `ipfs://${response.data.IpfsHash}`,
                error: null,
            };
        } catch (error) {
            logger.error("Error creating NFT metadata:", error);
            return {
                metadataUri: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create metadata",
            };
        }
    }
}
