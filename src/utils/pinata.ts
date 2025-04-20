import PinataSDK from '@pinata/sdk';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Load environment variables
config();

// Initialize Pinata SDK with API key and secret
const pinata = new PinataSDK({ 
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET,
});

export interface NFTAttribute {
    trait_type: string;
    value: string | number;
}

export interface NFTMetadataInput {
    name: string;
    description: string;
    image: File | Blob;
    attributes?: NFTAttribute[];
}

export interface NFTMetadataOutput {
    name: string;
    description: string;
    image: string;
    attributes?: NFTAttribute[];
    imageUrl: string;      // Gateway URL for image preview
    metadataUrl: string;   // IPFS URL for NFT metadata
}

// Match Pinata SDK's metadata type requirements
interface PinataMetadata {
    name: string;
    keyvalues?: Record<string, string | number | null>;
    [key: string]: any;  // Allow additional string-indexed properties
}

export class PinataService {
    // Maximum file size (10MB)
    private static MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Allowed image types
    private static ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Validates the image file before upload
     * @param file Image file to validate
     * @throws Error if validation fails
     */
    private static validateImage(file: File | Blob): void {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }

        // Check file type
        if (file instanceof File) {
            if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
                throw new Error(`Invalid file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`);
            }
        } else {
            // For Blob, try to detect type
            const fileType = file.type;
            if (!fileType || !this.ALLOWED_IMAGE_TYPES.includes(fileType)) {
                throw new Error('Invalid or unknown file type');
            }
        }
    }

    /**
     * Creates NFT metadata and uploads both image and metadata to IPFS
     * @param metadata NFT metadata including the image file
     * @returns Formatted metadata with IPFS URLs
     */
    static async createNFTMetadata(metadata: NFTMetadataInput): Promise<NFTMetadataOutput> {
        try {
            // Validate input data
            if (!metadata.name?.trim()) {
                throw new Error('Name is required');
            }
            if (!metadata.description?.trim()) {
                throw new Error('Description is required');
            }
            if (!metadata.image) {
                throw new Error('Image is required');
            }

            // Validate image
            this.validateImage(metadata.image);

            // 1. Upload the image first
            const imageHash = await this.uploadImage(metadata.image, metadata.name);
            const imageIpfsUrl = `ipfs://${imageHash}`;
            const imageGatewayUrl = `${process.env.PINATA_GATEWAY}/ipfs/${imageHash}`;

            // 2. Create and upload the metadata
            const nftMetadata = {
                name: metadata.name.trim(),
                description: metadata.description.trim(),
                image: imageIpfsUrl,  // Using IPFS URL format
                attributes: metadata.attributes || [],
            };

            // 3. Upload the metadata to IPFS
            const metadataHash = await this.uploadJSON(nftMetadata, `${metadata.name}-metadata`);
            const metadataIpfsUrl = `ipfs://${metadataHash}`;

            // 4. Return the complete metadata with all URLs
            return {
                ...nftMetadata,
                imageUrl: imageGatewayUrl,    // For preview purposes
                metadataUrl: metadataIpfsUrl,  // For NFT minting
            };
        } catch (error: unknown) {
            console.error('Error creating NFT metadata:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to create NFT metadata: ${error.message}`);
            }
            throw new Error('Failed to create NFT metadata: Unknown error');
        }
    }

    private static async uploadImage(file: File | Blob, name: string): Promise<string> {
        try {
            // Create a temporary file
            const tempDir = os.tmpdir();
            const tempPath = path.join(tempDir, `${name}-image`);
            
            // Convert File/Blob to Buffer and write to temp file
            const buffer = await file.arrayBuffer();
            fs.writeFileSync(tempPath, Buffer.from(buffer));
            
            // Upload to Pinata with retry logic
            let retries = 3;
            let result;
            
            const metadata: PinataMetadata = {
                name: `${name}-image`,
                keyvalues: {
                    type: 'nft-image',
                    timestamp: new Date().toISOString(),
                },
            };
            
            while (retries > 0) {
                try {
                    result = await pinata.pinFileToIPFS(fs.createReadStream(tempPath), {
                        pinataMetadata: metadata,
                    });
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }
            
            // Clean up
            fs.unlinkSync(tempPath);
            
            if (!result?.IpfsHash) {
                throw new Error('Failed to get IPFS hash from Pinata');
            }
            
            return result.IpfsHash;
        } catch (error: unknown) {
            console.error('Error uploading image:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to upload image: ${error.message}`);
            }
            throw new Error('Failed to upload image: Unknown error');
        }
    }

    private static async uploadJSON(data: any, name: string): Promise<string> {
        try {
            const metadata: PinataMetadata = {
                name,
                keyvalues: {
                    type: 'nft-metadata',
                    timestamp: new Date().toISOString(),
                },
            };

            const result = await pinata.pinJSONToIPFS(data, {
                pinataMetadata: metadata,
            });
            
            if (!result?.IpfsHash) {
                throw new Error('Failed to get IPFS hash from Pinata');
            }
            
            return result.IpfsHash;
        } catch (error: unknown) {
            console.error('Error uploading JSON:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to upload metadata: ${error.message}`);
            }
            throw new Error('Failed to upload metadata: Unknown error');
        }
    }
}

// Example frontend usage:
/*
// In your frontend component:
const handleNFTCreation = async (imageFile: File) => {
    try {
        const nftData = {
            image: imageFile,
            name: "My Meeting NFT",
            description: "NFT for an amazing meeting session",
            attributes: [
                {
                    trait_type: "Type",
                    value: "Meeting"
                },
                {
                    trait_type: "Duration",
                    value: 60
                }
            ]
        };

        const result = await PinataService.createNFTMetadata(nftData);
        
        // Use the metadata URL for minting
        const metadataURL = result.metadataUrl;
        
        // Call your contract minting function with the metadata URL
        await MeetingContractUtils.deployAndMint({
            sessionName: nftData.name,
            metadataURL: metadataURL,
            creator: recipientAddress,
            minters: [recipientAddress],
            recipientAddress
        });
    } catch (error) {
        console.error('Error creating NFT:', error);
    }
};
*/ 