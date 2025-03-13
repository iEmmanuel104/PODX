import { Request, Response } from 'express';
import { POAPService } from '../services/poap.service';
import { logger } from '../utils/logger';
import { Call } from '../models/Mongodb/call.model';
import { POAP } from '../models/Mongodb/poap.model';

export class POAPController {
    /**
     * Get all POAPs owned by a specific user
     * @route GET /api/poap/user/:userId
     */
    public static async getUserPOAPs(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;
            const details = await POAPService.getUserTokenGateOptions(walletAddress);
            
            res.status(200).json({
                success: true,
                data: details,
            });
        } catch (error) {
            console.error("Error getting user POAPs:", error);
            res.status(500).json({
                success: false,
                message: `Failed to get user POAPs: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    /**
     * Get all POAPs issued for a specific call
     * @route GET /api/poap/call/:callId
     */
    static async getCallPOAPs(req: Request, res: Response): Promise<void> {
        try {
            const { callId } = req.params;
            const poaps = await POAPService.getCallPOAPs(callId);
            
            res.status(200).json({
                success: true,
                data: poaps,
                count: poaps.length
            });
        } catch (error) {
            logger.error('Error fetching call POAPs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch call POAPs',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get details for a specific meeting
     * @route GET /api/poap/meeting/:meetingAddress
     */
    public static async getMeetingDetails(req: Request, res: Response): Promise<void> {
        try {
            const { meetingAddress } = req.params;
            const details = await POAPService.getMeetingDetails(meetingAddress);
            
            res.status(200).json({
                success: true,
                data: details,
            });
        } catch (error) {
            console.error("Error getting meeting details:", error);
            res.status(500).json({
                success: false,
                message: `Failed to get meeting details: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    /**
     * Check if a wallet owns NFTs from a specific meeting
     * @route GET /api/poap/verify/:meetingAddress/:walletAddress
     */
    static async verifyWalletOwnership(req: Request, res: Response): Promise<void> {
        try {
            const { meetingAddress, walletAddress } = req.params;
            const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
            
            res.status(200).json({
                success: true,
                hasNFT
            });
        } catch (error) {
            logger.error(`Error verifying NFT ownership for wallet ${req.params.walletAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify NFT ownership',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get all meetings
     * @route GET /api/poap/meetings
     */
    public static async getAllMeetings(req: Request, res: Response): Promise<void> {
        try {
            const meetings = await POAPService.getAllMeetings();
            
            res.status(200).json({
                success: true,
                data: meetings,
                count: meetings.length
            });
        } catch (error) {
            console.error("Error getting all meetings:", error);
            res.status(500).json({
                success: false,
                message: `Failed to get meetings: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    /**
     * Get meeting count
     * @route GET /api/poap/meetings/count
     */
    public static async getMeetingCount(req: Request, res: Response): Promise<void> {
        try {
            const count = await POAPService.getMeetingCount();
            
            res.status(200).json({
                success: true,
                count
            });
        } catch (error) {
            logger.error('Error fetching meeting count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch meeting count',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get wallet POAP call history
     * @route GET /api/poap/wallet/:walletAddress/calls
     */
    static async getWalletPOAPCalls(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;
            
            // Get all meetings
            const meetings = await POAPService.getAllMeetings();
            
            // Check wallet ownership for each meeting
            const poapCalls = await Promise.all(
                meetings.map(async (meetingAddress) => {
                    const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
                    if (hasNFT) {
                        const details = await POAPService.getMeetingDetails(meetingAddress);
                        return {
                            meetingAddress,
                            ...details
                        };
                    }
                    return null;
                })
            );
            
            // Filter out null results
            const validPoapCalls = poapCalls.filter(call => call !== null);
            
            res.status(200).json({
                success: true,
                count: validPoapCalls.length,
                data: validPoapCalls
            });
        } catch (error) {
            logger.error(`Error fetching POAP calls for wallet ${req.params.walletAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch wallet POAP calls',
                error: (error as Error).message
            });
        }
    }

    /**
     * Check token gate access for a session and wallet
     * @route GET /api/poap/tokengate/check/:sessionName/:walletAddress
     */
    static async checkTokenGateAccess(req: Request, res: Response): Promise<void> {
        try {
            const { sessionName, walletAddress } = req.params;
            
            // Get existing calls with this session name
            const calls = await Call.find({ 'custom.tokenGateInfo.sessionName': sessionName });
            
            if (calls.length === 0) {
                res.status(404).json({
                    success: false,
                    message: `No calls found with session name ${sessionName}`
                });
                return;
            }
            
            // Find the most recent call with token gate info
            const poapCalls = await Promise.all(
                calls.map(async call => {
                    if (call.custom?.tokenGateInfo?.addresses?.length > 0) {
                        return {
                            callId: call.callId,
                            custom: call.custom
                        };
                    }
                    return null;
                })
            );
            
            // Filter out null results
            const validPoapCalls = poapCalls.filter(call => call !== null);
            
            if (validPoapCalls.length === 0) {
                res.status(404).json({
                    success: false,
                    message: `No token gated calls found with session name ${sessionName}`
                });
                return;
            }
            
            // Sort by most recent (assuming _id contains timestamp)
            const call = validPoapCalls[0];
            
            // Get token gate addresses
            const tokenGateAddresses = call.custom.tokenGateInfo.addresses || [];
            
            // Get user token gate options
            const userTokenGateOptions = await POAPService.getUserTokenGateOptions(walletAddress);
            
            // Check if user has any of the required NFTs
            const hasAccess = userTokenGateOptions.some(option =>
                tokenGateAddresses.includes(option.meetingAddress.toLowerCase())
            );
            
            res.status(200).json({
                success: true,
                hasAccess,
                tokenGateInfo: call.custom.tokenGateInfo,
                userTokens: userTokenGateOptions.map(o => o.meetingAddress)
            });
        } catch (error) {
            logger.error(`Error checking token gate access for ${req.params.sessionName}:`, error);
            res.status(500).json({
                success: false,
                message: `Failed to check token gate access: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    /**
     * Direct check for token gate access by meeting address
     * @route GET /api/poap/tokengate/direct/:meetingAddress/:walletAddress
     */
    static async checkDirectTokenGateAccess(req: Request, res: Response): Promise<void> {
        try {
            const { meetingAddress, walletAddress } = req.params;
            
            // Check if wallet has NFT from this meeting
            const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
            
            // Get meeting details if has access
            const meetingDetails = hasNFT ? await POAPService.getMeetingDetails(meetingAddress) : null;
            
            res.status(200).json({
                success: true,
                hasAccess: hasNFT,
                meetingDetails
            });
        } catch (error) {
            logger.error(`Error checking direct token gate access for ${req.params.meetingAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to check direct token gate access',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get all token gate options for a specific wallet
     * @route GET /api/poap/tokengate/options/:walletAddress
     */
    static async getUserTokenGateOptions(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;
            const tokenGateOptions = await POAPService.getUserTokenGateOptions(walletAddress);
            
            res.status(200).json({
                success: true,
                data: tokenGateOptions
            });
        } catch (error) {
            logger.error('Error fetching token gate options:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch token gate options',
                error: (error as Error).message
            });
        }
    }

    /**
     * Save external token gating addresses
     * @route POST /api/poap/tokengate/external
     */
    static async saveExternalTokenGateAddresses(req: Request, res: Response): Promise<void> {
        try {
            const { callId, addresses } = req.body;
            
            if (!callId || !addresses || !Array.isArray(addresses)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request - callId and addresses array required'
                });
                return;
            }
            
            // Update call with token gating info
            await Call.findOneAndUpdate(
                { callId },
                { 
                    $set: {
                        'custom.tokenGateInfo': {
                            enabled: true,
                            addresses: addresses.map(addr => addr.toLowerCase()),
                        }
                    }
                }
            );
            
            res.status(200).json({
                success: true,
                message: `Token gating enabled with ${addresses.length} addresses`,
                count: addresses.length
            });
        } catch (error) {
            logger.error('Error saving external token gate addresses:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save token gate addresses',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get POAP status for a specific call
     * @route GET /api/poap/status/:callId
     */
    static async getPoapStatus(req: Request, res: Response): Promise<void> {
        try {
            const { callId } = req.params;
            
            // Get the call record
            const call = await Call.findOne({ callId });
            if (!call) {
                res.status(404).json({
                    success: false,
                    message: `Call ${callId} not found`
                });
                return;
            }
            
            // Get POAP records for this call
            const poaps = await POAP.find({ callId });
            
            // Get meeting information if available
            let meetingDetails = null;
            if (call.custom?.poap?.contractAddress) {
                try {
                    meetingDetails = await POAPService.getMeetingDetails(call.custom.poap.contractAddress);
                } catch (meetingError) {
                    logger.error(`Error getting meeting details: ${meetingError}`);
                    meetingDetails = { 
                        error: meetingError instanceof Error ? meetingError.message : String(meetingError),
                        address: call.custom.poap.contractAddress 
                    };
                }
            }
            
            // Calculate statistics
            const stats = {
                totalMembers: call.members.length,
                totalPoapRecords: poaps.length,
                mintedCount: poaps.filter(p => p.status === 'minted').length,
                pendingCount: poaps.filter(p => p.status === 'pending').length,
                callDuration: call.duration,
                hasContractAddress: !!call.custom?.poap?.contractAddress,
                contractAddress: call.custom?.poap?.contractAddress || null,
                eligibleParticipants: (call.custom?.poap as any)?.eligible?.length || 0
            };
            
            res.status(200).json({
                success: true,
                callId,
                title: call.custom?.title || `Call ${callId}`,
                startTime: call.startTime,
                endTime: call.endTime,
                duration: call.duration,
                stats,
                poapInfo: call.custom?.poap || null,
                meetingDetails,
                poaps: poaps.map(p => ({
                    id: p._id,
                    userId: p.userId,
                    status: p.status,
                    tokenId: p.tokenId || null,
                    contractAddress: p.contractAddress
                }))
            });
        } catch (error) {
            logger.error(`Error getting POAP status: ${error}`);
            res.status(500).json({
                success: false,
                message: `Error getting POAP status: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    /**
     * Generate POAPs for a specific call
     * Can be accessed via GET or POST
     * @route GET /api/poap/generate/:callId
     * @route POST /api/poap/generate/:callId (admin only)
     */
    static async generatePOAPs(req: Request, res: Response): Promise<void> {
        try {
            const { callId } = req.params;
            
            // First check if call exists and get basic info
            const call = await Call.findOne({ callId });
            if (!call) {
                res.status(404).json({
                    success: false,
                    message: `Call ${callId} not found`
                });
                return;
            }
            
            // Log eligibility criteria from environment variables
            logger.info(`Generating POAPs for call ${callId}`);
            logger.info(`Call duration: ${call.duration} seconds`);
            logger.info(`Members in call: ${call.members?.length || 0}`);
            logger.info(`Eligibility criteria:`);
            logger.info(`  - MIN_PARTICIPANTS: ${process.env.MIN_PARTICIPANTS || "2"}`);
            logger.info(`  - MIN_CALL_DURATION: ${process.env.MIN_CALL_DURATION || "60"} seconds`);
            logger.info(`  - MIN_PARTICIPANT_DURATION: ${process.env.MIN_PARTICIPANT_DURATION || "30"} seconds`);
            
            // Log any existing POAP information
            let existingContractAddress = null;
            if (call.custom?.poap?.contractAddress) {
                existingContractAddress = call.custom.poap.contractAddress;
                logger.info(`Call already has POAP contract at ${existingContractAddress}`);
                
                // Get POAPs that have been minted for this call
                const poaps = await POAP.find({ callId });
                logger.info(`Found ${poaps.length} POAPs for this call`);
                
                const mintedCount = poaps.filter(p => p.status === 'minted').length;
                const pendingCount = poaps.filter(p => p.status === 'pending').length;
                logger.info(`POAP statuses: ${mintedCount} minted, ${pendingCount} pending`);
                
                res.status(200).json({
                    success: true,
                    message: `POAPs already generated for call ${callId}`,
                    callInfo: {
                        id: callId,
                        duration: call.duration || 0,
                        memberCount: call.members?.length || 0,
                        poapContractAddress: existingContractAddress,
                        poapCount: poaps.length,
                        poapStatus: {
                            minted: mintedCount,
                            pending: pendingCount
                        }
                    }
                });
                return;
            }
            
            // Now generate the POAPs
            const beforePoaps = await POAP.countDocuments({ callId });
            let errorDuringProcessing = null;
            
            try {
                await POAPService.handleCallPOAP(callId);
            } catch (processingError) {
                errorDuringProcessing = processingError;
                logger.error(`Error during POAP generation: ${processingError}`);
            }
            
            // Get updated call info after POAP handling
            const updatedCall = await Call.findOne({ callId });
            const poaps = await POAP.find({ callId });
            const afterPoaps = poaps.length;
            
            // Check if contract address changed
            const newContractAddress = updatedCall?.custom?.poap?.contractAddress || null;
            const contractAddressChanged = existingContractAddress !== newContractAddress && newContractAddress !== null;
            
            if (contractAddressChanged) {
                logger.info(`POAP contract address created: ${newContractAddress}`);
            }
            
            // Get meeting details if we have a contract address
            let meetingDetails = null;
            if (newContractAddress) {
                try {
                    meetingDetails = await POAPService.getMeetingDetails(newContractAddress);
                } catch (meetingError) {
                    logger.error(`Error getting meeting details: ${meetingError}`);
                }
            }
            
            res.status(200).json({
                success: !errorDuringProcessing,
                message: errorDuringProcessing
                    ? `Error during POAP generation: ${errorDuringProcessing instanceof Error ? errorDuringProcessing.message : String(errorDuringProcessing)}`
                    : `Generated POAPs for call ${callId}`,
                callInfo: {
                    id: callId,
                    duration: updatedCall?.duration || 0,
                    memberCount: updatedCall?.members?.length || 0,
                    poapContractAddress: newContractAddress,
                    poapCount: poaps.length,
                    newPoapsMinted: afterPoaps - beforePoaps,
                    poapStatus: {
                        minted: poaps.filter(p => p.status === 'minted').length,
                        pending: poaps.filter(p => p.status === 'pending').length
                    }
                },
                meetingDetails: meetingDetails || null,
                error: errorDuringProcessing ?
                    (errorDuringProcessing instanceof Error ? errorDuringProcessing.message : String(errorDuringProcessing)) :
                    null
            });
        } catch (error) {
            logger.error(`Error generating POAPs for call ${req.params.callId}:`, error);
            res.status(500).json({
                success: false,
                message: `Failed to generate POAPs: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    static async triggerPOAPIssuance(req: Request, res: Response): Promise<void | Response> {
        try {
            const { callId } = req.params;
            
            if (!callId) {
                return res.status(400).json({ error: "callId parameter is required" });
            }

            await POAPService.handleCallPOAP(callId);
            
            res.json({
                success: true,
                message: "POAP issuance process started"
            });
        } catch (error) {
            console.error("POAP issuance error:", error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
}

// Export the triggerPOAPIssuance function individually for direct use in routes
export const triggerPOAPIssuance = POAPController.triggerPOAPIssuance;
