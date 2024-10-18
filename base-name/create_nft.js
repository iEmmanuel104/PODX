// Import necessary dependencies and utilities
import { useNftConfig } from './nft_config';
import { useSignTypedData, useWriteContract } from 'wagmi';
import {
    makeMediaTokenMetadata,
    generateTextNftMetadataFiles,
    makeTextTokenMetadata,
} from "@zoralabs/protocol-sdk";
import { pinFileWithPinata, pinJsonWithPinata } from "./pinata";

// Define the structure for contract metadata
type ContractMetadataJson = {
    name?: string;
    description?: string;
    image?: string;
    external_link?: string;
}

// Define constants for NFT creation and minting
const CREATE_REFERRAL = "0x1234567890123456789012345678901234567890"; // Replace with actual referral address
const PRICE_PER_TOKEN = 0n; // Free mint
const PAYOUT_RECIPIENT = "0x0000000000000000000000000000000000000000"; // Zero address as no value is attached
const MINT_DURATION = 604800n; // 7 days in seconds
const MAX_TOKENS_PER_ADDRESS = 1n;

// Main NFTManager class to handle NFT-related operations
class NFTManager {
    constructor(nftConfig) {
        // Initialize with configuration from nft_config
        this.creatorClient = nftConfig.creatorClient;
        this.collectorClient = nftConfig.collectorClient;
        this.userAccount = nftConfig.userAccount;
        this.walletClient = nftConfig.walletClient;
        this.publicClient = nftConfig.publicClient;
    }

    // Create a new premint
    async createPremint(premintDetails) {
        const result = await this.creatorClient.createPremint({
            contract: {
                contractAdmin: this.userAccount,
                contractName: premintDetails.contractName,
                contractURI: premintDetails.contractURI,
            },
            token: {
                tokenURI: premintDetails.tokenURI,
                createReferral: premintDetails.createReferral,
                maxSupply: premintDetails.maxSupply,
                maxTokensPerAddress: premintDetails.maxTokensPerAddress,
                mintStart: premintDetails.mintStart,
                mintDuration: premintDetails.mintDuration,
                pricePerToken: premintDetails.pricePerToken,
                payoutRecipient: premintDetails.payoutRecipient,
            },
        });

        return {
            signAndSubmit: () => result.signAndSubmit({
                account: this.userAccount,
                walletClient: this.walletClient,
                checkSignature: true,
            }),
            typedDataDefinition: result.typedDataDefinition,
            submit: result.submit
        };
    }

    // Sign and submit a premint
    async signAndSubmitPremint(createPremintResult) {
        return createPremintResult.signAndSubmit();
    }

    // Check if a premint is already on-chain
    async isPremintOnChain(collection, uid) {
        try {
            const tokenExists = await this.publicClient.readContract({
                address: collection,
                abi: [
                    {
                        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
                        name: "exists",
                        outputs: [{ internalType: "bool", name: "", type: "bool" }],
                        stateMutability: "view",
                        type: "function"
                    }
                ],
                functionName: 'exists',
                args: [BigInt(uid)]
            });
            return tokenExists;
        } catch (error) {
            console.error("Error checking if premint is on-chain:", error);
            return false;
        }
    }

    // Update an existing premint
    async updatePremint(collection, uid, tokenConfigUpdates) {
        if (await this.isPremintOnChain(collection, uid)) {
            throw new Error("Cannot update premint: It has already been brought on-chain");
        }

        const result = await this.creatorClient.updatePremint({
            collection,
            uid,
            tokenConfigUpdates,
        });

        return {
            signAndSubmit: () => result.signAndSubmit({
                walletClient: this.walletClient,
                account: this.userAccount,
            }),
            typedDataDefinition: result.typedDataDefinition,
            submit: result.submit
        };
    }

    // Delete an existing premint
    async deletePremint(collection, uid) {
        if (await this.isPremintOnChain(collection, uid)) {
            throw new Error("Cannot delete premint: It has already been brought on-chain");
        }

        const result = await this.creatorClient.deletePremint({
            collection,
            uid,
        });

        return {
            signAndSubmit: () => result.signAndSubmit({
                account: this.userAccount,
                walletClient: this.walletClient,
            }),
            typedDataDefinition: result.typedDataDefinition,
            submit: result.submit
        };
    }

    // Build metadata for an image-based NFT
    async buildImageTokenMetadata({ imageFile, thumbnailFile }) {
        const mediaFileIpfsUrl = await pinFileWithPinata(imageFile);
        const thumbnailFileIpfsUrl = await pinFileWithPinata(thumbnailFile);

        const metadataJson = makeMediaTokenMetadata({
            mediaUrl: mediaFileIpfsUrl,
            thumbnailUrl: thumbnailFileIpfsUrl,
            name: imageFile.name,
        });

        return await pinJsonWithPinata(metadataJson);
    }

    // Build metadata for a text-based NFT
    async buildTextNftMetadata({ text }) {
        const { name, mediaUrlFile, thumbnailFile } = await generateTextNftMetadataFiles(text);

        const mediaFileIpfsUrl = await pinFileWithPinata(mediaUrlFile);
        const thumbnailFileIpfsUrl = await pinFileWithPinata(thumbnailFile);

        const metadataJson = makeTextTokenMetadata({
            name,
            textFileUrl: mediaFileIpfsUrl,
            thumbnailUrl: thumbnailFileIpfsUrl,
        });

        return await pinJsonWithPinata(metadataJson);
    }

    // Build metadata for the NFT contract
    async buildContractMetadata({ name, description, imageFile, externalLink }) {
        const imageFileIpfsUrl = await pinFileWithPinata(imageFile);

        const metadataJson = {
            name,
            description,
            image: imageFileIpfsUrl,
            external_link: externalLink
        };

        return await pinJsonWithPinata(metadataJson);
    }

    // Build metadata for an individual token
    async buildTokenMetadata({ name, description, imageFile, attributes }) {
        const imageFileIpfsUrl = await pinFileWithPinata(imageFile);

        const metadataJson = {
            name,
            description,
            image: imageFileIpfsUrl,
            attributes: attributes || []
        };

        return await pinJsonWithPinata(metadataJson);
    }

    // Mint a premint NFT
    async mintPremint(meetingId, mintComment = "") {
        const isAssociated = await this.isWalletAssociatedWithMeeting(meetingId, this.userAccount);
        if (!isAssociated) {
            throw new Error("You did not attend this meeting and are not authorized to mint this NFT");
        }

        const { collection, uid } = await this.getPremintDetails(meetingId);

        const { parameters } = await this.collectorClient.mint({
            tokenContract: collection,
            mintType: "premint",
            uid,
            quantityToMint: 1,
            mintComment,
            minterAccount: this.userAccount,
        });

        return parameters;
    }

    // Get rewards balances
    async getRewardsBalances(account = this.userAccount) {
        return this.creatorClient.getRewardsBalances({ account });
    }

    // Withdraw rewards
    async withdrawRewards(withdrawFor = this.userAccount, account = this.userAccount, claimSecondaryRoyalties = true) {
        const { parameters } = await this.creatorClient.withdrawRewards({
            withdrawFor,
            claimSecondaryRoyalties,
            account,
        });

        const hash = await this.walletClient.writeContract(parameters);
        const receipt = await this.creatorClient.publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
            throw new Error("Transaction failed");
        }

        return receipt;
    }

    // Placeholder: Check if a wallet is associated with a meeting
    async isWalletAssociatedWithMeeting(meetingId, walletAddress) {
        console.log(`Checking if wallet ${walletAddress} is associated with meeting ${meetingId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Math.random() < 0.5;
    }

    // Placeholder: Get premint details for a meeting
    async getPremintDetails(meetingId) {
        console.log(`Retrieving premint details for meeting ${meetingId}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            collection: "0x1234567890123456789012345678901234567890",
            uid: "12345",
        };
    }

    // Create an image NFT premint
    async createImageNFTPremint({
        contractName,
        contractDescription,
        contractImageFile,
        externalLink,
        tokenName,
        tokenDescription,
        tokenImageFile,
        tokenAttributes,
        createReferral,
        maxSupply,
        maxTokensPerAddress,
        mintStart,
        mintDuration,
        pricePerToken,
        payoutRecipient
    }) {
        const contractMetadataUri = await this.buildContractMetadata({
            name: contractName,
            description: contractDescription,
            imageFile: contractImageFile,
            externalLink
        });

        const tokenMetadataUri = await this.buildTokenMetadata({
            name: tokenName,
            description: tokenDescription,
            imageFile: tokenImageFile,
            attributes: tokenAttributes
        });

        const result = await this.creatorClient.createPremint({
            contract: {
                contractAdmin: this.userAccount,
                contractName,
                contractURI: contractMetadataUri,
            },
            token: {
                tokenURI: tokenMetadataUri,
                createReferral,
                maxSupply,
                maxTokensPerAddress,
                mintStart,
                mintDuration,
                pricePerToken,
                payoutRecipient,
            },
        });

        return {
            signAndSubmit: () => result.signAndSubmit({
                account: this.userAccount,
                walletClient: this.walletClient,
                checkSignature: true,
            }),
            typedDataDefinition: result.typedDataDefinition,
            submit: result.submit
        };
    }

    // Placeholder: Get meeting metadata from database
    async getMeetingMetadataFromDatabase(meetingId) {
        // This is a placeholder function. In a real implementation,
        // you would query your database to get the meeting metadata.
        console.log(`Retrieving metadata for meeting ${meetingId}`);

        // Simulating a database query delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock data that represents what you'd typically get from a database
        return {
            meetingId: meetingId,
            meetingName: `Meeting ${meetingId}`,
            meetingDescription: `This is a detailed description for meeting ${meetingId}. It covers important topics and decisions made during the session.`,
            imageUrl: `https://example.com/meeting-images/${meetingId}.jpg`,
            date: new Date().toISOString(),
            startTime: "14:00",
            endTime: "15:30",
            duration: "1 hour 30 minutes",
            host: {
                address: "0xabc123...",
                name: "John Doe"
            },
            attendees: [
                { address: "0x123...", name: "Alice" },
                { address: "0x456...", name: "Bob" },
                { address: "0x789...", name: "Charlie" }
            ],
            topics: ["Project Updates", "Budget Review", "Future Plans"],
            decisions: ["Approved new marketing strategy", "Set Q3 goals"],
            location: "Virtual",
            platform: "Zoom",
            recordingUrl: `https://example.com/meeting-recordings/${meetingId}.mp4`,
            tags: ["Important", "Quarterly Review"],
            department: "Marketing",
            meetingType: "Team Sync",
            nextMeetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // One week from now
        };
    }

    // Create metadata for a meeting NFT
    async createMeetingNFTMetadata(meetingId) {
        // Get meeting metadata from the database
        const meetingData = await this.getMeetingMetadataFromDatabase(meetingId);

        // Download the image file
        const imageResponse = await fetch(meetingData.imageUrl);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], `meeting-${meetingId}-image.jpg`, { type: "image/jpeg" });

        // Pin the image to IPFS
        const imageIpfsUrl = await pinFileWithPinata(imageFile);

        // Create the NFT metadata
        const nftMetadata = {
            name: meetingData.meetingName,
            description: meetingData.meetingDescription,
            image: imageIpfsUrl,
            attributes: [
                { trait_type: "Date", value: meetingData.date },
                { trait_type: "Host", value: meetingData.host.name },
                { trait_type: "Department", value: meetingData.department },
                { trait_type: "Meeting Type", value: meetingData.meetingType },
                { trait_type: "Location", value: meetingData.location },
                { trait_type: "Platform", value: meetingData.platform }
            ],
            properties: {
                host: meetingData.host,
                topics: meetingData.topics,
                decisions: meetingData.decisions,
                recordingUrl: meetingData.recordingUrl,
                tags: meetingData.tags,
                nextMeetingDate: meetingData.nextMeetingDate
            }
        };

        // Pin the metadata JSON to IPFS
        const metadataIpfsUrl = await pinJsonWithPinata(nftMetadata);

        return {
            tokenUri: metadataIpfsUrl,
            contractMetadata: {
                name: "Meeting Attendance NFTs",
                description: "NFTs representing attendance at various meetings",
                image: imageIpfsUrl, // Using the same image for the contract metadata
            }
        };
    }

    // Placeholder: Query database for meeting details
    async queryDatabaseForMeetingDetails(meetingId) {
        // This is a placeholder function. In a real implementation,
        // you would query your database to get the meeting details.
        console.log(`Querying database for details of meeting ${meetingId}`);

        // Simulating a database query delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in a real implementation, this would come from your database
        return {
            meetingId: meetingId,
            meetingName: `Meeting ${meetingId}`,
            description: `Description for meeting ${meetingId}`,
            date: new Date().toISOString(),
            host: "John Doe",
            attendees: ["0x123...", "0x456...", "0x789..."],
            maxSupply: BigInt(attendees.length), // Set max supply to number of attendees
            imageUrl: `https://example.com/meeting-images/${meetingId}.jpg`,
            // Add any other relevant meeting data here
        };
    }

    // Fetch and prepare meeting NFT details
    async fetchMeetingNFTDetails(meetingId) {
        // Query the database for meeting details
        const meetingDetails = await this.queryDatabaseForMeetingDetails(meetingId);

        // Download and pin the meeting image
        const imageResponse = await fetch(meetingDetails.imageUrl);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], `meeting-${meetingId}-image.jpg`, { type: "image/jpeg" });
        const imageIpfsUrl = await pinFileWithPinata(imageFile);

        // Create and pin the token metadata
        const tokenMetadata = {
            name: meetingDetails.meetingName,
            description: meetingDetails.description,
            image: imageIpfsUrl,
            attributes: [
                { trait_type: "Date", value: meetingDetails.date },
                { trait_type: "Host", value: meetingDetails.host },
                { trait_type: "Attendees", value: meetingDetails.attendees.length }
            ]
        };
        const tokenUri = await pinJsonWithPinata(tokenMetadata);

        // Create and pin the contract metadata
        const contractMetadata = {
            name: "Meeting Attendance NFTs",
            description: "NFTs representing attendance at various meetings",
            image: imageIpfsUrl,
        };
        const contractUri = await pinJsonWithPinata(contractMetadata);

        // Combine database results with constants and IPFS URIs
        return {
            createReferral: CREATE_REFERRAL,
            maxSupply: meetingDetails.maxSupply,
            maxTokensPerAddress: MAX_TOKENS_PER_ADDRESS,
            mintStart: BigInt(Math.floor(Date.now() / 1000)), // Current timestamp
            mintDuration: MINT_DURATION,
            pricePerToken: PRICE_PER_TOKEN,
            payoutRecipient: PAYOUT_RECIPIENT,
            tokenUri: tokenUri,
            contractName: "Meeting Attendance NFTs",
            contractUri: contractUri,
        };
    }

    // Create a meeting NFT premint
    async createMeetingNFTPremint(meetingId) {
        const nftDetails = await this.fetchMeetingNFTDetails(meetingId);

        const result = await this.creatorClient.createPremint({
            contract: {
                contractAdmin: this.userAccount,
                contractName: nftDetails.contractName,
                contractURI: nftDetails.contractUri,
            },
            token: {
                tokenURI: nftDetails.tokenUri,
                createReferral: nftDetails.createReferral,
                maxSupply: nftDetails.maxSupply,
                maxTokensPerAddress: nftDetails.maxTokensPerAddress,
                mintStart: nftDetails.mintStart,
                mintDuration: nftDetails.mintDuration,
                pricePerToken: nftDetails.pricePerToken,
                payoutRecipient: nftDetails.payoutRecipient,
            },
        });

        return {
            signAndSubmit: () => result.signAndSubmit({
                account: this.userAccount,
                walletClient: this.walletClient,
                checkSignature: true,
            }),
            typedDataDefinition: result.typedDataDefinition,
            submit: result.submit
        };
    }
}

// Hook to use the NFTManager
export function useNFTManager() {
    const nftConfig = useNftConfig();
    const { signTypedData } = useSignTypedData();
    const { writeContract } = useWriteContract();

    if (!nftConfig) {
        return null;
    }

    const nftManager = new NFTManager(nftConfig);

    return {
        ...nftManager,
        // Additional method to sign with wagmi and submit premint
        signWithWagmiAndSubmitPremint: async (createPremintResult) => {
            const signature = await signTypedData(createPremintResult.typedDataDefinition);
            if (signature) {
                return createPremintResult.submit({ signature });
            }
            throw new Error("Failed to sign the premint");
        },
        // Method to execute minting
        executeMint: async (parameters) => {
            return await writeContract(parameters);
        }
    };
}