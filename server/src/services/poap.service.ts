/* eslint-disable @typescript-eslint/no-explicit-any */
// services/poap.service.ts
import { Call } from "../models/Mongodb/call.model";
import { User } from "../models/Mongodb/user.model";
import { POAP } from "../models/Mongodb/poap.model";
import { logger } from "../utils/logger";
import { POAPManagementService } from './poap_management.service';
import { getSmartAccountAddress } from './paymaster.service';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import { MeetingDetails } from '../interfaces/meeting.interface';
import { TokenGateOptions } from '../interfaces/token-gate.interface';
import { POAPError } from '../errors/poap.error';
import { ICall } from '../interfaces/call.interface';
import { IUser } from '../interfaces/user.interface';

dotenv.config();

interface ParticipantTime {
    userId: string;
    joinTime: Date;
    leaveTime: Date;
    duration: number;
}

export class POAPService {
    private static poapManager: POAPManagementService;
    private static initialized: boolean = false;

    // Essential POAP eligibility criteria from environment variables
    private static readonly MIN_PARTICIPANT_DURATION = parseInt(process.env.MIN_PARTICIPANT_DURATION || "30", 10); // Minimum time a participant must be in call (seconds)
    private static readonly MIN_PARTICIPANTS = parseInt(process.env.MIN_PARTICIPANTS || "2", 10); // Minimum number of participants required
    private static readonly MIN_CALL_DURATION = parseInt(process.env.MIN_CALL_DURATION || "60", 10); // Minimum total call duration (seconds)

    /**
     * Initialize the POAP Manager
     */
    private static async initializePOAPManager(): Promise<void> {
        try {
            if (POAPService.initialized) return;
            console.log("Initializing POAP Manager with paymaster...");
            POAPService.poapManager = new POAPManagementService();
            await POAPService.poapManager.initialize();
            POAPService.initialized = true;
            console.log("POAP Manager initialized successfully with paymaster");
        } catch (error) {
            console.error("Error initializing POAP Manager:", error);
            throw error;
        }
    }

    /**
     * Handle POAP generation for a call
     */
    public static async handleCallPOAP(callId: string): Promise<void> {
        try {
            await POAPService.initializePOAPManager();
            console.log(`[POAP] Starting handling for call ${callId}`);
            const call = await Call.findOne({ callId }).populate("members.userId") as unknown as ICall;

            if (!call) {
                logger.error(`Call ${callId} not found`);
                return;
            }

            logger.info(`Processing POAP for call ${callId} with ${call.members.length} members`);
            
            // Log participant details
            const participants = call.members.map(member => {
                const user = member.userId as any; // Type as any to access dynamic properties
                return {
                    userId: user?._id || member.userId,
                    name: user?.name || 'Unknown',
                    wallet: user?.wallet || 'No wallet'
                };
            });
            logger.info(`Participants: ${JSON.stringify(participants)}`);

            // Check if this call already has POAPs
            const existingPOAPs = await POAP.find({ callId });
            if (existingPOAPs.length > 0) {
                logger.info(`Call ${callId} already has ${existingPOAPs.length} POAPs`);
                
                // Log contract address if available
                if (call.custom?.poap?.contractAddress) {
                    logger.info(`Call ${callId} has POAP contract at address: ${call.custom.poap.contractAddress}`);
                    
                    // Type as any to access dynamic properties
                    const poapInfo = call.custom.poap as any;
                    logger.info(`Call ${callId} POAP session name: ${poapInfo.sessionName || 'Unknown'}`);
                    logger.info(`Call ${callId} POAP transaction hash: ${poapInfo.sessionTxHash || 'Unknown'}`);
                    
                    // Log eligible participants
                    if (poapInfo.eligible && poapInfo.eligible.length) {
                        logger.info(`Call ${callId} has ${poapInfo.eligible.length} eligible participants`);
                    }
                    
                    // Get meeting details
                    try {
                        const details = await POAPService.poapManager.getMeetingDetails(call.custom.poap.contractAddress);
                        logger.info(`Meeting details for ${callId}: ${JSON.stringify(details)}`);
                    } catch (detailsError) {
                        logger.error(`Error getting meeting details: ${detailsError}`);
                    }
                }
                
                // Update status if needed
                for (const poap of existingPOAPs) {
                    if (poap.status === 'pending' && call.custom?.poap?.contractAddress) {
                        poap.status = 'minted';
                        poap.contractAddress = call.custom.poap.contractAddress;
                        await poap.save();
                        logger.info(`Updated POAP status for user ${poap.userId} to minted`);
                    }
                }
                
                // Log how many POAPs are in each status
                const pendingCount = existingPOAPs.filter(p => p.status === 'pending').length;
                const mintedCount = existingPOAPs.filter(p => p.status === 'minted').length;
                logger.info(`POAP statuses: ${pendingCount} pending, ${mintedCount} minted`);
                
                return;
            }

            // Check eligibility - minimum duration, minimum participants, etc.
            if (!POAPService.isCallEligible(call)) {
                logger.info(`Call ${callId} not eligible for POAPs`);
                return;
            }

            // Get eligible participants
            const eligibleParticipants = await POAPService.getEligibleParticipants(call);
            logger.info(`Call ${callId} has ${eligibleParticipants.length} eligible participants`);

            // Enforce minimum participants
            if (eligibleParticipants.length < POAPService.MIN_PARTICIPANTS) {
                logger.info(
                    `Call ${callId} does not have enough eligible participants (${eligibleParticipants.length}/${POAPService.MIN_PARTICIPANTS})`
                );
                return;
            }

            // Generate metadata for the POAP
            const sessionId = Math.floor(Math.random() * 1000000);

            // Use Cloudinary URL for the image
            const imageUrl = process.env.CLOUDINARY_POAP_URL || 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/poaps/default.png';

            // Generate metadata
            const sessionName = call.custom?.title || `Call ${callId}`;
            const description = call.custom?.description || `This POAP represents participation in call ${callId}`;
            
            // Create metadata object
            const metadata = {
                name: `PODX Call #${call.callId}`,
                description,
                image: imageUrl,
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
                    }
                ]
            };

            // Get creator from database with proper validation
            // Check if creator exists in the call object - use the right property based on your schema
            const creatorId = call.creator || (call as any).host || call.members[0]?.userId;
            if (!creatorId) {
                throw new POAPError("Creator ID not found in call data");
            }
            
            const creatorUser = await User.findById(creatorId);
            if (!creatorUser) {
                throw new POAPError("Creator user not found");
            }
            
            // Make sure to access the wallet address using the correct property name from your User model
            const creatorWalletAddress = (creatorUser as any).walletAddress || (creatorUser as any).wallet || (creatorUser as any).ethereumAddress;
            if (!creatorWalletAddress) {
                throw new POAPError("Creator wallet address not found");
            }
            
            const { meetingAddress, txHash } = await POAPService.poapManager.deployMeeting({
                sessionName,
                metadataUri: JSON.stringify(metadata),
                creatorAddress: creatorWalletAddress
            });

            console.log(`Deployed meeting contract at ${meetingAddress}`);
            
            // Get recipient count
            const details = await POAPService.poapManager.getMeetingDetails(meetingAddress);
            console.log(`Meeting has ${details.recipientCount} recipients`);

            // Update call record with the POAP contract info
            await Call.findOneAndUpdate(
                { callId },
                {
                    $set: {
                        "custom.poap": {
                            contractAddress: meetingAddress,
                            sessionId,
                            sessionName,
                            sessionTxHash: txHash,
                            eligible: eligibleParticipants.map(p => p._id)
                        }
                    }
                }
            );

            // Create POAP records for all eligible participants
            const poapRecords = eligibleParticipants.map(participant => ({
                userId: participant._id,
                callId,
                contractAddress: meetingAddress,
                status: "pending",
                metadata
            }));

            await POAP.insertMany(poapRecords);
            logger.info(`Created ${poapRecords.length} POAP records for call ${callId}`);

            // If wallet addresses are available, mint the POAPs
            const recipients = eligibleParticipants
                .filter(p => {
                    // Check all possible wallet property names
                    const walletAddress = p.walletAddress || p.wallet || p.ethereumAddress;
                    return !!walletAddress;
                })
                .map(p => p.walletAddress || p.wallet || p.ethereumAddress);

            if (recipients.length > 0) {
                try {
                    console.log(`Individual minting ${recipients.length} POAPs...`);
                    // Use individual minting instead of batch mint
                    for (let i = 0; i < recipients.length; i++) {
                        const recipient = recipients[i];
                        const user = eligibleParticipants.find(u => 
                            (u.walletAddress || u.wallet || u.ethereumAddress) === recipient
                        );
                        
                        try {
                            // Use the meetingDetails interface to mint tokens
                            const result = await details.mint(recipient, JSON.stringify(metadata));
                            
                            // Update the POAP record
                            if (user) {
                                await POAP.findOneAndUpdate(
                                    { userId: user._id, callId },
                                    {
                                $set: {
                                            status: "minted",
                                            tokenId: result.tokenId
                                        }
                                    }
                                );
                                console.log(`Successfully minted POAP for ${recipient}`);
                            }
                        } catch (mintError) {
                            logger.error(`Error minting POAP for ${recipient}: ${mintError}`);
                        }
                    }
                } catch (batchError) {
                    logger.error(`Minting failed: ${batchError}`);
                }
            }
        } catch (error) {
            logger.error(`Error handling POAP for call ${callId}:`, error);
            throw error;
        }
    }

    /**
     * Get all meeting contracts deployed
     */
    public static async getAllMeetings(): Promise<string[]> {
        try {
            await POAPService.initializePOAPManager();
            const details = await POAPService.poapManager.getMeetingDetails("0x0");
            return [details.address];
        } catch (error) {
            logger.error("Error getting all meetings:", error);
            throw error;
        }
    }

    /**
     * Get the count of all meeting contracts
     */
    public static async getMeetingCount(): Promise<number> {
        try {
            await POAPService.initializePOAPManager();
            return await POAPService.poapManager.getMeetingCount();
        } catch (error) {
            logger.error("Error getting meeting count:", error);
            throw error;
        }
    }

    /**
     * Get meeting details from the blockchain
     */
    public static async getMeetingDetails(meetingAddress: string): Promise<any> {
        try {
            await POAPService.initializePOAPManager();
            const details = await POAPService.poapManager.getMeetingDetails(meetingAddress);
            return {
                address: details.address,
                sessionName: details.sessionName,
                metadataURL: details.metadataURL,
                creator: details.creator,
                recipients: details.recipients,
                recipientCount: details.recipients.length
            };
        } catch (error) {
            console.error("Error getting meeting details:", error);
            throw new POAPError(`Failed to get meeting details: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check if a call is eligible for POAPs
     */
    private static isCallEligible(call: any): boolean {
        // Existing duration check
        const callDuration = call.duration;
        if (callDuration < POAPService.MIN_CALL_DURATION) {
            logger.info(`Call ${call.callId} too short (${callDuration}s)`);
            return false;
        }

        // Must have at least MIN_PARTICIPANTS users
        if (call.members.length < POAPService.MIN_PARTICIPANTS) {
            logger.info(`Call ${call.callId} doesn't have enough participants (${call.members.length})`);
            return false;
        }

        // Additional checks if needed

        return true;
    }

    /**
     * Get join and leave times for each participant
     */
    private static async getParticipantTimes(call: any): Promise<ParticipantTime[]> {
        const result: ParticipantTime[] = [];

        // Process each member
        for (const member of call.members) {
            if (!member.userId) continue; // Skip if no user ID

            const userId = typeof member.userId === 'object' ? member.userId._id : member.userId;

            // Calculate join and leave times
            const joinTime = member.joinedAt || call.startTime; // Use call start if no join time
            const leaveTime = member.leftAt || call.endTime; // Use call end if no leave time

            // Calculate duration in seconds
            const durationMs = new Date(leaveTime).getTime() - new Date(joinTime).getTime();
            const duration = Math.floor(durationMs / 1000);

            result.push({
                userId: userId.toString(),
                joinTime: new Date(joinTime),
                leaveTime: new Date(leaveTime),
                duration
            });
        }

        return result;
    }

    /**
     * Get eligible participants based on participation time
     */
    private static async getEligibleParticipants(call: any): Promise<any[]> {
        const participantTimes = await POAPService.getParticipantTimes(call);
        const eligibleUserIds = participantTimes
            .filter(pt => pt.duration >= POAPService.MIN_PARTICIPANT_DURATION)
            .map(pt => pt.userId);

        return await User.find({
            _id: { $in: eligibleUserIds }
        });
    }

    /**
     * Get all POAPs for a user
     */
    public static async getUserPOAPs(userId: string): Promise<any[]> {
        return await POAP.find({ userId });
    }

    /**
     * Get all POAPs for a call
     */
    public static async getCallPOAPs(callId: string): Promise<any[]> {
        return await POAP.find({ callId });
    }

    /**
     * Check if a wallet has NFTs from a specific meeting
     */
    public static async walletHasMeetingNFT(
        walletAddress: string,
        meetingAddress: string
    ): Promise<boolean> {
        try {
            await POAPService.initializePOAPManager();
            const details = await POAPService.poapManager.getMeetingDetails(meetingAddress);
            return details.recipients.some(
                (recipient: string) => recipient.toLowerCase() === walletAddress.toLowerCase()
            );
        } catch (error) {
            logger.error(`Error checking wallet NFT ownership:`, error);
            return false;
        }
    }

    /**
     * Check if a user has NFTs from a specific meeting
     */
    public static async userHasMeetingNFT(
        userId: string,
        meetingAddress: string
    ): Promise<boolean> {
        try {
        // Get the user's wallet address
            const user = await User.findById(userId).select('walletAddress');
        if (!user || !user.walletAddress) {
                logger.info(`User ${userId} has no wallet address`);
                return false;
            }

            // Check if the wallet has the NFT
            return await POAPService.walletHasMeetingNFT(user.walletAddress, meetingAddress);
        } catch (error) {
            logger.error(`Error checking user NFT ownership:`, error);
            return false;
        }
    }

    /**
     * Check if a meeting has enough participants and duration for POAP
     */
    public static async checkMeetingEligibility(
        participants: string[],
        duration: number,
    ): Promise<boolean> {
        try {
            // Check if meeting has minimum required participants
            if (participants.length < POAPService.MIN_PARTICIPANTS) {
                console.log(`Meeting does not have minimum required participants (${POAPService.MIN_PARTICIPANTS})`);
                return false;
            }

            // Check if meeting duration meets minimum requirement
            if (duration < POAPService.MIN_CALL_DURATION) {
                console.log(`Meeting duration (${duration}s) is less than minimum required (${POAPService.MIN_CALL_DURATION}s)`);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error checking meeting eligibility:", error);
            throw new POAPError(`Failed to check meeting eligibility: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Calculate POAP eligibility based on participant duration - Simplified for production
     */
    public static async calculatePOAPEligibility(
        participants: string[],
        participantDurations: { [key: string]: number },
        meetingDuration: number,
    ): Promise<string[]> {
        try {
            // Check if meeting is eligible for POAP
            const isEligible = await POAPService.checkMeetingEligibility(participants, meetingDuration);
            if (!isEligible) {
                return [];
            }

            // Simple eligibility check: Must meet minimum duration requirement
            return participants.filter(
                (participant) =>
                    participantDurations[participant] &&
                    participantDurations[participant] >= POAPService.MIN_PARTICIPANT_DURATION
            );
        } catch (error) {
            console.error("Error calculating POAP eligibility:", error);
            throw new POAPError(`Failed to calculate POAP eligibility: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Test paymaster connection
     */
    public static async testPaymasterConnection(): Promise<{ success: boolean; smartAccountAddress: string }> {
        try {
            await POAPService.initializePOAPManager();
            const smartAccountAddress = await POAPService.poapManager.getAccountAddress();
            console.log(`Paymaster connection test successful using POAP manager. Smart Account Address: ${smartAccountAddress}`);
            return {
                success: true,
                smartAccountAddress
            };
        } catch (error) {
            console.error("Paymaster connection test failed:", error);
            throw new POAPError(`Paymaster connection test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deploy a new POAP meeting contract
     */
    public static async deployMeeting(
        meetingDetails: MeetingDetails,
        tokenGateOptions?: TokenGateOptions,
    ): Promise<{ meetingAddress: string; txHash: string }> {
        try {
            await POAPService.initializePOAPManager();
            return await POAPService.poapManager.deployMeeting(meetingDetails, tokenGateOptions);
        } catch (error) {
            console.error("Error deploying meeting:", error);
            throw new POAPError(`Failed to deploy meeting: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get user token gate options
     */
    public static async getUserTokenGateOptions(walletAddress: string): Promise<TokenGateOptions[]> {
        try {
            await POAPService.initializePOAPManager();
            return await POAPService.poapManager.getUserTokenGateOptions(walletAddress);
        } catch (error) {
            console.error("Error getting user token gate options:", error);
            throw new POAPError(`Failed to get user token gate options: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
