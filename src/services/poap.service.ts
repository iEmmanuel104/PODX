import { Call, ICall } from '../models/Mongodb/call.model';
import { User } from '../models/Mongodb/user.model';
import { MeetingContractUtils } from '../utils/meetingContractUtils';
import RequirementService from './requirement.service';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/customErrors';

interface ParticipantEligibility {
    userId: string;
    walletAddress?: string;
    username?: string;
    eligible: boolean;
    timeSpentMinutes: number;
    requiredTimeMinutes: number;
}

interface MintingStatus {
    [key: string]: {
        status: 'pending' | 'success' | 'failed';
        txHash?: string;
        error?: string;
    };
}

export class POAPService {
    /**
     * Handles POAP distribution for a completed call
     * This is automatically triggered when a call ends
     */
    static async handleCallPOAP(callId: string): Promise<void> {
        try {
            logger.info('Starting POAP distribution for call:', callId);

            // 1. Check requirements for all participants
            const requirementResult = await RequirementService.checkAllRequirements(callId);
            
            if (!requirementResult.eligible || !requirementResult.details.participantDetails) {
                logger.info('No eligible participants for POAP distribution in call:', callId);
                return;
            }

            // 2. Get eligible participants with wallet addresses
            const eligibleParticipants = requirementResult.details.participantDetails.filter((p: ParticipantEligibility) => p.eligible);
            
            if (eligibleParticipants.length === 0) {
                logger.info('No eligible participants with wallet addresses for call:', callId);
                return;
            }

            // 3. Get call details for metadata
            const call = await Call.findOne({ callId }).populate('members.userId');
            if (!call) {
                throw new BadRequestError('Call not found');
            }

            // 4. Get metadata URI (either custom or default)
            const metadataURI = call.custom?.metadata?.imageUrl || 'ipfs://default-meeting-metadata';

            // 5. Deploy meeting contract with eligible participants as minters
            const eligibleAddresses = eligibleParticipants
                .filter((p: ParticipantEligibility) => p.walletAddress)
                .map((p: ParticipantEligibility) => p.walletAddress as `0x${string}`);

            if (eligibleAddresses.length === 0) {
                logger.info('No eligible participants with valid wallet addresses');
                return;
            }

            const deployResult = await MeetingContractUtils.deployMeeting({
                sessionName: call.custom?.metadata?.name || `Call-${callId}`,
                metadataURL: metadataURI,
                creator: eligibleAddresses[0],
                minters: eligibleAddresses,
            });

            // 6. Update call with complete POAP information
            const sessionId = Date.now();
            const updateResult = await Call.findOneAndUpdate(
                { callId },
                {
                    $set: {
                        'custom.poap': {
                            enabled: true,
                            contractAddress: deployResult.meetingAddress,
                            sessionId: sessionId,
                            status: 'deployed',
                            participantCount: eligibleParticipants.length,
                            creator: eligibleAddresses[0],
                            mintingStatus: {} as MintingStatus,
                        },
                    },
                },
                { new: true }
            );

            if (!updateResult) {
                throw new BadRequestError('Failed to update call with POAP information');
            }

            // 7. Mint tokens to all eligible participants
            const mintingStatus: MintingStatus = {};
            let successfulMints = 0;

            for (const participant of eligibleParticipants) {
                if (!participant.walletAddress) continue;

                try {
                    mintingStatus[participant.walletAddress] = { status: 'pending' };
                    
                    const mintResult = await MeetingContractUtils.mintToken({
                        meetingAddress: deployResult.meetingAddress,
                        recipient: participant.walletAddress as `0x${string}`,
                        metadataURI,
                    });

                    mintingStatus[participant.walletAddress] = {
                        status: 'success',
                        txHash: mintResult,
                    };
                    successfulMints++;

                    logger.info('Successfully minted POAP to:', participant.walletAddress);
                } catch (error) {
                    mintingStatus[participant.walletAddress] = {
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                    logger.error('Error minting POAP to participant:', {
                        participant: participant.walletAddress,
                        error,
                    });
                }

                // Update minting status in database after each mint attempt
                await Call.updateOne(
                    { callId },
                    {
                        $set: {
                            'custom.poap.mintingStatus': mintingStatus,
                            'custom.poap.status': successfulMints === eligibleParticipants.length ? 'completed' : 'partial',
                        },
                    }
                );
            }

            // Final status update
            await Call.updateOne(
                { callId },
                {
                    $set: {
                        'custom.poap.status': successfulMints === 0 ? 'failed' :
                            successfulMints === eligibleParticipants.length ? 'completed' : 'partial',
                    },
                }
            );

            logger.info('Completed POAP distribution for call:', {
                callId,
                totalParticipants: eligibleParticipants.length,
                successfulMints,
                status: mintingStatus,
            });

        } catch (error) {
            logger.error('Error in POAP distribution:', error);
            // Update call status to failed if deployment error occurs
            await Call.updateOne(
                { callId },
                {
                    $set: {
                        'custom.poap.status': 'failed',
                        'custom.poap.error': error instanceof Error ? error.message : 'Unknown error',
                    },
                }
            );
            throw error;
        }
    }
}
