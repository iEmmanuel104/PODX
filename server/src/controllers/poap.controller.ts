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
    static async getUserPOAPs(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const poaps = await POAPService.getUserPOAPs(userId);
            
            res.status(200).json({
                success: true,
                data: poaps,
                count: poaps.length
            });
        } catch (error) {
            logger.error('Error fetching user POAPs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user POAPs',
                error: (error as Error).message
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
     * Get details of a specific meeting contract
     * @route GET /api/poap/meeting/:meetingAddress
     */
    static async getMeetingDetails(req: Request, res: Response): Promise<void> {
        try {
            const { meetingAddress } = req.params;
            const details = await POAPService.getMeetingDetails(meetingAddress);
            
            res.status(200).json({
                success: true,
                data: details
            });
        } catch (error) {
            logger.error(`Error fetching meeting details for ${req.params.meetingAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch meeting details',
                error: (error as Error).message
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
     * Get all meeting contracts deployed
     * @route GET /api/poap/meetings
     */
    static async getAllMeetings(req: Request, res: Response): Promise<void> {
        try {
            const meetings = await POAPService.getAllMeetings();
            
            res.status(200).json({
                success: true,
                data: meetings,
                count: meetings.length
            });
        } catch (error) {
            logger.error('Error fetching all meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch meetings',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get the count of all meeting contracts
     * @route GET /api/poap/meetings/count
     */
    static async getMeetingCount(req: Request, res: Response): Promise<void> {
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
     * Get all the calls that resulted in POAPs for a specific wallet address
     * @route GET /api/poap/wallet/:walletAddress/calls
     */
    static async getWalletPOAPCalls(req: Request, res: Response): Promise<void> {
        try {
            const { walletAddress } = req.params;
            
            // First get all meetings
            const meetings = await POAPService.getAllMeetings();
            
            // Then check each meeting to see if the wallet is a recipient
            const relevantMeetings = [];
            for (const meetingAddress of meetings) {
                const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
                if (hasNFT) {
                    const details = await POAPService.getMeetingDetails(meetingAddress);
                    relevantMeetings.push(details);
                }
            }
            
            res.status(200).json({
                success: true,
                data: relevantMeetings,
                count: relevantMeetings.length
            });
        } catch (error) {
            logger.error(`Error fetching POAP calls for wallet ${req.params.walletAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch POAP calls',
                error: (error as Error).message
            });
        }
    }

    /**
     * Check if a wallet has access to a token-gated session
     * @route GET /api/poap/tokengate/:sessionName/:walletAddress
     */
    static async checkTokenGateAccess(req: Request, res: Response): Promise<void> {
        try {
            const { sessionName, walletAddress } = req.params;
            
            // Get the call by session name
            const call = await Call.findOne({
                'custom.title': sessionName
            });
            
            if (!call) {
                res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    hasAccess: false
                });
                return;
            }
            
            // If token gating is not enabled, grant access immediately
            if (!call.custom?.tokenGateInfo?.enabled) {
                res.status(200).json({
                    success: true,
                    message: 'Token gating not enabled for this session',
                    hasAccess: true
                });
                return;
            }
            
            // Proceed with token gate verification if enabled...
            // Check external token gating first (direct address list)
            if (call.custom?.tokenGateInfo?.addresses) {
                const addresses = call.custom.tokenGateInfo.addresses as string[];
                const hasAccess = addresses.some((addr: string) => 
                    addr.toLowerCase() === walletAddress.toLowerCase()
                );
                
                if (hasAccess) {
                    res.status(200).json({
                        success: true,
                        hasAccess: true,
                        method: 'external',
                        message: 'Access granted: Wallet in whitelist'
                    });
                    return;
                }
            }
            
            // Default denial response if no access methods matched
            res.status(200).json({
                success: true,
                hasAccess: false,
                method: 'denied',
                message: 'Access denied: Wallet not authorized'
            });
        } catch (error) {
            logger.error(`Error checking token gate access for ${req.params.sessionName}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to check token gate access',
                error: (error as Error).message,
                hasAccess: false
            });
        }
    }

    /**
     * Check if a wallet has access to a specific meeting
     * @route GET /api/poap/tokengate/direct/:meetingAddress/:walletAddress
     */
    static async checkDirectTokenGateAccess(req: Request, res: Response): Promise<void> {
        try {
            const { meetingAddress, walletAddress } = req.params;
            
            // Check if this wallet has an NFT from this meeting
            const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
            
            // Get additional meeting information if needed
            const meetingDetails = hasNFT ? await POAPService.getMeetingDetails(meetingAddress) : null;
            
            res.status(200).json({
                success: true,
                meetingAddress,
                hasAccess: hasNFT,
                details: meetingDetails,
                message: hasNFT ? 'Access granted' : 'Access denied: No matching NFT found'
            });
        } catch (error) {
            logger.error(`Error checking direct token gate access for ${req.params.meetingAddress}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to check token gate access',
                error: (error as Error).message,
                hasAccess: false
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
            
            // Get all meetings
            const meetings = await POAPService.getAllMeetings();
            
            // Check which meetings this wallet has NFTs for
            const tokenGateOptions = [];
            for (const meetingAddress of meetings) {
                const hasNFT = await POAPService.walletHasMeetingNFT(walletAddress, meetingAddress);
                if (hasNFT) {
                    const details = await POAPService.getMeetingDetails(meetingAddress);
                    tokenGateOptions.push({
                        contractAddress: meetingAddress,
                        sessionName: details.sessionName,
                        // Other useful info
                    });
                }
            }
            
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
     * Get debug POAP status
     * @route GET /api/poap/debug/:callId
     */
    static async debugPoapStatus(req: Request, res: Response): Promise<void> {
        try {
            const { callId } = req.params;
            
            // Get all records related to this call
            const poaps = await POAP.find({ callId });
            const call = await Call.findOne({ callId });
            
            res.status(200).json({
                success: true,
                data: {
                    poapCount: poaps.length,
                    poapStatus: poaps.map(p => p.status),
                    contractAddress: call?.custom?.poap?.contractAddress,
                    sessionId: call?.custom?.poap?.sessionId,
                    deploymentTransaction: call?.custom?.poap?.sessionTxHash
                }
            });
        } catch (error) {
            // Handle error
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Trigger POAP generation for a specific call
     * @route GET /api/poap/trigger/:callId
     */
    static async triggerPoapGeneration(req: Request, res: Response): Promise<void> {
        try {
            const { callId } = req.params;
            
            await POAPService.handleCallPOAP(callId);
            
            res.status(200).json({
                success: true,
                message: 'POAP generation triggered'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message
            });
        }
    }
}
