/* eslint-disable @typescript-eslint/no-explicit-any */
// services/poap.service.ts
import { Call } from "../models/Mongodb/call.model";
import { User } from "../models/Mongodb/user.model";
import { POAP } from "../models/Mongodb/poap.model";
import { logger } from "../utils/logger";
import { MetadataService } from "./metadata.service";
import dotenv from "dotenv";

// Import the POAP Management Service
const { POAPManagementService } = require("./poap_management_service");

dotenv.config();

interface ParticipantTime {
    userId: string;
    joinTime: Date;
    leaveTime: Date;
    duration: number;
}

export class POAPService {
    // Make constants configurable via environment variables with fallbacks
    private static readonly MIN_CALL_DURATION = 60; // 1 minute instead of 30
    private static readonly MIN_PARTICIPANT_DURATION = 30; // 30 seconds instead of 10 minutes
    private static readonly MIN_PARTICIPANTS = parseInt(
        process.env.MIN_PARTICIPANTS || "2",
        10,
    );

    // Initialize the POAP Management Service
    private static readonly poapManager = new POAPManagementService();

    /**
     * Process a completed call to issue POAPs to eligible participants
     * @param callId The ID of the call to process
     */
    static async handleCallPOAP(callId: string): Promise<void> {
        try {
            console.log(`[POAP] Starting handling for call ${callId}`);
            const call = await Call.findOne({ callId }).populate("members.userId");
            
            if (!call) {
                console.error(`[POAP] Call ${callId} not found in database`);
                return;
            }

            console.log(`[POAP] Call status: ${call.status}, POAP status: ${call.custom?.poap?.status}`);
            
            // Add debug logging for eligibility checks
            const isEligible = this.isCallEligible(call);
            console.log(`[POAP] Eligibility check result: ${isEligible}`);
            
            if (!isEligible) {
                console.log(`[POAP] Call ${callId} not eligible for POAP generation`);
                return;
            }
            
            // Ensure call is marked as ended
            if (call.status !== "ended") {
                console.log(`Call ${callId} not ended yet - POAP generation skipped`);
                return;
            }

            // Check if POAP already exists
            if (call.custom?.poap?.status === "completed") {
                console.log(`POAP already generated for call ${callId}`);
                return;
            }

            // Get eligible participants
            const eligibleParticipants = await this.getEligibleParticipants(call);
            
            // Enforce minimum participants
            if (eligibleParticipants.length < this.MIN_PARTICIPANTS) {
                logger.info(
                    `Call ${callId} does not have enough eligible participants (${eligibleParticipants.length}/${this.MIN_PARTICIPANTS})`
                );
                return;
            }

            // Initialize the POAP Management Service
            await this.poapManager.initialize();

            // Create session for this call
            const sessionId = Date.now();
            const sessionName = `Call-${callId}`;
            
            // Generate direct image URL for this POAP (works in both test and production)
            const metadataUri = this.generateDirectImageUrl(callId, sessionId, call);
            console.log(`[POAP] Using direct URL for NFT image: ${metadataUri}`);

            // Find host of the call to use as the real creator
            let realCreator: string;

            // Get creator's wallet address directly - this is the most reliable source
            const creator = await User.findById(call.createdById);
            if (!creator || !creator.walletAddress) {
                logger.error(
                    `Could not find wallet address for call creator (${call.createdById})`,
                );
                throw new Error(
                    `Call creator must have a wallet address to mint POAPs`,
                );
            }
            realCreator = creator.walletAddress;
            
            // Extract all participant wallet addresses for the minters list
            const participantWallets = eligibleParticipants
                .filter(p => p.walletAddress)
                .map(p => p.walletAddress);
                
            console.log(`[POAP] Found ${participantWallets.length} participant wallets to add as minters`);

            // Deploy Meeting contract using POAPManagementService with participant wallets
            console.log(`[POAP] Starting POAP deployment for call ${callId}`);
            const { meetingAddress, txHash } =
                await this.poapManager.deployMeeting(
                    sessionName,
                    metadataUri,
                    realCreator,
                    participantWallets // Pass participant wallets
                );
            console.log(`[POAP] Meeting contract deployed at ${meetingAddress} with transaction ${txHash}`);
            console.log(`[POAP] CONTRACT ADDRESS VALUE TYPE: ${typeof meetingAddress}, LENGTH: ${meetingAddress.length}`);

            // Verify deployment
            const deploymentReceipt = await this.poapManager.confirmTransaction(txHash, "MeetingCreated");
            if (!deploymentReceipt) {
                throw new Error("Meeting contract deployment verification failed");
            }

            // Prepare recipient arrays for batch minting with duplicate detection
            const recipients: string[] = [];
            const participantMetadataUris: string[] = [];
            const poapRecords: any[] = [];
            const addressMap = new Map<string, number>(); // To track duplicates

            // Create POAP records for all eligible participants
            for (const participant of eligibleParticipants) {
                try {
                    // Create pending POAP record in database
                    const poapRecord = await POAP.create({
                        sessionId,
                        callId,
                        userId: participant._id,
                        transactionHash: txHash,
                        contractAddress: meetingAddress,
                        metadataUri, // Same metadata URI for all participants
                        status: "pending",
                        attributes: {
                            callDuration: call.duration,
                            participantCount: eligibleParticipants.length,
                            callDate: call.endTime,
                        },
                    });
                    
                    // Add to batch minting arrays if participant has a wallet
                    if (participant.walletAddress) {
                        const address = participant.walletAddress.toLowerCase();
                        
                        // Check for duplicates
                        if (addressMap.has(address)) {
                            console.log(`WARNING: Duplicate wallet address detected: ${address}`);
                            // We still keep the POAP record but won't try to mint twice
                            poapRecords.push(poapRecord);
                            continue;
                        }
                        
                        // Track this address
                        addressMap.set(address, recipients.length);
                        recipients.push(address);
                        participantMetadataUris.push(metadataUri);
                        poapRecords.push(poapRecord);
                    }
                } catch (error) {
                    logger.error(
                        `Error creating POAP record for participant ${participant._id}:`,
                        error,
                    );
                    // Continue with other participants
                }
            }

            console.log(`Prepared ${recipients.length} unique recipients for minting`);

            // Batch mint NFTs for all participants in a single transaction
            if (recipients.length > 0) {
                try {
                    console.log(`Batch minting ${recipients.length} POAPs...`);
                    const meetingContract = await this.poapManager.getMeetingContract(meetingAddress);
                    const result = await meetingContract.batchMint(recipients, participantMetadataUris);
                    
                    // Update all POAP records with their token IDs
                    for (let i = 0; i < recipients.length; i++) {
                        await POAP.findByIdAndUpdate(poapRecords[i]._id, {
                            $set: {
                                tokenId: result.tokenIds[i],
                                mintTxHash: result.txHash,
                                status: "minted"
                            }
                        });
                        console.log(`Updated record for ${recipients[i]} with token ID ${result.tokenIds[i]}`);
                    }
                    
                    console.log(`Successfully batch minted ${recipients.length} tokens with transaction ${result.txHash}`);
                } catch (error) {
                    console.error(`Failed to batch mint: ${error}`);
                    // Fall back to individual minting if batch fails
                    console.log(`Falling back to individual minting...`);
                    
                    // Get Meeting contract interface again for individual mints
                    const meetingContract = await this.poapManager.getMeetingContract(meetingAddress);
                    
                    for (let i = 0; i < recipients.length; i++) {
                        try {
                            console.log(`Minting to address: ${recipients[i]}`);
                            
                            const result = await meetingContract.mint(recipients[i], participantMetadataUris[i]);
                            console.log(`Successfully minted token ID ${result.tokenId} to ${recipients[i]} with tx ${result.txHash}`);
                            
                            // Update POAP record
                            await POAP.findByIdAndUpdate(poapRecords[i]._id, {
                                $set: {
                                    tokenId: result.tokenId,
                                    mintTxHash: result.txHash,
                                    status: "minted"
                                }
                            });
                        } catch (error) {
                            console.error(`Failed to mint for ${recipients[i]}: ${error}`);
                        }
                    }
                }
                
                console.log(`[POAP] Completed minting process for call ${callId}`);
            }

            // Update call record with POAP details
            await Call.findOneAndUpdate(
                { callId },
                {
                    $set: {
                        "custom.poap": {
                            sessionId,
                            sessionTxHash: txHash,
                            contractAddress: meetingAddress,
                            status: "deployed",
                            deploymentTxHash: txHash,
                            deployedAt: new Date(),
                            participantCount: eligibleParticipants.length,
                            creator: realCreator,
                        },
                    },
                },
            );
        } catch (error) {
            console.error("Error in automated POAP handling:", error);
            // Add retry logic or error reporting here
        }
    }

    /**
     * Get all meeting contracts deployed by the factory
     * @returns Array of meeting contract addresses
     */
    static async getAllMeetings(): Promise<string[]> {
        try {
            await this.poapManager.initialize();
            return await this.poapManager.getAllMeetings();
        } catch (error) {
            logger.error("Error getting all meetings:", error);
            throw error;
        }
    }

    /**
     * Get the count of all meeting contracts deployed by the factory
     * @returns Number of meeting contracts
     */
    static async getMeetingCount(): Promise<number> {
        try {
            await this.poapManager.initialize();
            return await this.poapManager.getMeetingCount();
        } catch (error) {
            logger.error("Error getting meeting count:", error);
            throw error;
        }
    }

    /**
     * Get details of a specific meeting contract
     * @param meetingAddress The address of the meeting contract
     * @returns Meeting contract details
     */
    static async getMeetingDetails(meetingAddress: string): Promise<any> {
        try {
            await this.poapManager.initialize();
            const meetingContract =
                await this.poapManager.getMeetingContract(meetingAddress);
            // Get all available information from the contract
            const [sessionName, metadataURL, creator, recipients] = await Promise.all(
                [
                    meetingContract.sessionName(),
                    meetingContract.metadataURL(),
                    meetingContract.creator(),
                    meetingContract.getNFTRecipients(),
                ],
            );
            return {
                address: meetingAddress,
                sessionName,
                metadataURL,
                creator,
                recipients,
                recipientCount: recipients.length,
            };
        } catch (error) {
            logger.error(
                `Error getting meeting details for ${meetingAddress}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Check if a call meets minimum duration requirements
     * @param call The call to check
     * @returns true if the call is eligible for POAPs
     */
    private static isCallEligible(call: any): boolean {
        // Existing duration check
        const callDuration = call.duration;
        if (callDuration < this.MIN_CALL_DURATION) {
            logger.info(`Call ${call.callId} too short (${callDuration}s)`);
            return false;
        }

        // New: Verify call was ended properly
        if (call.status !== 'ended' || !call.endedAt) {
            logger.info(`Call ${call.callId} not properly ended`);
            return false;
        }

        // New: Check if call ended naturally or by creator
        const scheduledEnd = new Date(call.starts_at);
        scheduledEnd.setMinutes(scheduledEnd.getMinutes() + call.scheduledDuration);
        const endedEarly = call.endedAt < scheduledEnd;

        if (endedEarly) {
            logger.info(`Call ${call.callId} ended early by creator`);
            // Allow POAP if ended by creator before scheduled end
            return true;
        }

        // If ended automatically after scheduled time
        return true;
    }

    /**
     * Calculate participation time for each member in the call
     * @param call The call data with events
     * @returns Array of participant times with join, leave and duration information
     */
    private static async getParticipantTimes(
        call: any,
    ): Promise<ParticipantTime[]> {
        const participantTimes: ParticipantTime[] = [];

        // Process each member's participation
        for (const member of call.members) {
            const participantEvents =
                call.custom?.events?.filter(
                    (event: any) =>
                        event.userId === member.userId.toString() &&
                        ["joined", "left"].includes(event.type),
                ) || [];

            if (participantEvents.length >= 2) {
                const joinTime = new Date(participantEvents[0].timestamp);
                const leaveTime = new Date(
                    participantEvents[participantEvents.length - 1].timestamp,
                );
                const duration = (leaveTime.getTime() - joinTime.getTime()) / 1000;

                participantTimes.push({
                    userId: member.userId.toString(),
                    joinTime,
                    leaveTime,
                    duration,
                });
            }
        }

        return participantTimes;
    }

    /**
     * Get users that participated long enough
     * @param call The call data
     * @returns Array of eligible user objects
     */
    private static async getEligibleParticipants(call: any): Promise<any[]> {
        // Always calculate eligibility properly
        const participantTimes = await this.getParticipantTimes(call);
        const eligibleUserIds = participantTimes
            .filter(pt => pt.duration >= this.MIN_PARTICIPANT_DURATION)
            .map(pt => pt.userId);

        return await User.find({
            _id: { $in: eligibleUserIds },
            walletAddress: { $exists: true, $ne: null }
        });
    }

    /**
     * Get all POAPs owned by a specific user
     * @param userId The user ID
     * @returns Array of POAP records
     */
    static async getUserPOAPs(userId: string): Promise<any[]> {
        return await POAP.find({ userId })
            .sort({ mintedAt: -1 })
            .populate("callId");
    }

    /**
     * Get all POAPs issued for a specific call
     * @param callId The call ID
     * @returns Array of POAP records
     */
    static async getCallPOAPs(callId: string): Promise<any[]> {
        return await POAP.find({ callId })
            .sort({ mintedAt: -1 })
            .populate("userId");
    }

    /**
     * Check if a wallet address owns NFTs from a specific meeting contract
     * @param walletAddress The wallet address to check
     * @param meetingAddress The address of the meeting contract
     * @returns true if the wallet has NFTs from this meeting
     */
    static async walletHasMeetingNFT(
        walletAddress: string,
        meetingAddress: string,
    ): Promise<boolean> {
        try {
            await this.poapManager.initialize();
            const meetingContract =
                await this.poapManager.getMeetingContract(meetingAddress);
            // Get all recipients from the contract
            const recipients = await meetingContract.getNFTRecipients();
            // Check if the wallet address is in the recipients list
            return recipients
                .map((addr: string) => addr.toLowerCase())
                .includes(walletAddress.toLowerCase());
        } catch (error) {
            logger.error(
                `Error checking NFT ownership for wallet ${walletAddress}:`,
                error,
            );
            return false;
        }
    }

    /**
     * Check if a user owns NFTs from a specific meeting by checking on-chain
     * @param userId The user ID
     * @param meetingAddress The address of the meeting contract
     * @returns true if the user has NFTs from this meeting
     */
    static async userHasMeetingNFT(
        userId: string,
        meetingAddress: string,
    ): Promise<boolean> {
        // Get the user's wallet address
        const user = await User.findById(userId);
        if (!user || !user.walletAddress) {
            return false;
        }
        // Use the on-chain verification method
        return this.walletHasMeetingNFT(user.walletAddress, meetingAddress);
    }

    /**
     * Generate a direct image URL for the POAP
     * This approach uses a constant URL for all POAPs
     * @param callId The call ID
     * @param sessionId The session ID
     * @param call The call object
     * @returns A fixed URL that can be used as the token URI
     */
    private static generateDirectImageUrl(callId: string, sessionId: number, call: any): string {
        // Use a constant URL for all POAPs
        return "https://gray-raw-earwig-481.mypinata.cloud/ipfs/bafkreigh3r7sfkclis5v7n6ovwyvmd2eanhojwpq3uwy2idgmxlg6feky4";
        
        // Previous dynamic approach (commented out):
        /*
        // Get environment-specific base URL
        const baseUrl = process.env.WEBSITE_URL || 'https://podxx.vercel.app';
        
        // Get call title or use default
        const title = call.custom?.title || `Call-${callId}`;
        
        // Get call duration in minutes
        const durationMinutes = Math.floor((call.duration || 0) / 60);
        
        // Generate a simple image URL with query parameters
        return `${baseUrl}/api/poap-image?callId=${callId}&sessionId=${sessionId}&title=${encodeURIComponent(title)}&duration=${durationMinutes}&participants=${call.members.length}`;
        */
    }
}
