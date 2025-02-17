/* eslint-disable @typescript-eslint/no-explicit-any */
// services/poap.service.ts
import { Call } from '../models/Mongodb/call.model';
import { User } from '../models/Mongodb/user.model';
import { POAP } from '../models/Mongodb/poap.model';
import POAPWeb3Client from '../clients/web3Config';
import { logger } from '../utils/logger';
import { MetadataService } from './metadata.service';

interface ParticipantTime {
    userId: string;
    joinTime: Date;
    leaveTime: Date;
    duration: number;
}

export class POAPService {
    private static readonly MIN_CALL_DURATION = 30 * 60; // 30 minutes in seconds
    private static readonly MIN_PARTICIPANT_DURATION = 10 * 60; // 10 minutes in seconds
    private static readonly MIN_PARTICIPANTS = 2;

    static async handleCallPOAP(callId: string): Promise<void> {
        try {
            const call = await Call.findOne({ callId }).populate('members.userId');
            if (!call) {
                logger.error(`Call ${callId} not found`);
                return;
            }

            // Check eligibility
            if (!this.isCallEligible(call)) {
                return;
            }

            // Get eligible participants
            const eligibleParticipants = await this.getEligibleParticipants(call);
            if (eligibleParticipants.length < this.MIN_PARTICIPANTS) {
                logger.info(`Call ${callId} does not have enough eligible participants`);
                return;
            }

            // Create session
            const sessionId = Date.now();
            const { metadataUri } = await MetadataService.generateAndUploadMetadata(
                call,
                eligibleParticipants[0], // Use first participant for session metadata
                sessionId
            );

            const sessionTxHash = await POAPWeb3Client.createSession({
                sessionName: `Call ${callId} POAP`,
                tokenURI: metadataUri,
                sessionId,
            });

            // Process each eligible participant
            for (const participant of eligibleParticipants) {
                try {
                    // Generate unique metadata for each participant
                    const { metadataUri, imageVariant } = await MetadataService.generateAndUploadMetadata(
                        call,
                        participant,
                        sessionId
                    );

                    // Create pending POAP record
                    const poapRecord = await POAP.create({
                        sessionId,
                        callId,
                        userId: participant._id,
                        transactionHash: sessionTxHash,
                        metadataUri,
                        imageVariant,
                        status: 'pending',
                        attributes: {
                            callDuration: call.duration,
                            participantCount: eligibleParticipants.length,
                            callDate: call.endTime,
                        },
                    });

                    // Mint token
                    if (participant.walletAddress) {
                        const mintTxHash = await POAPWeb3Client.batchMintTokens({
                            recipients: [participant.walletAddress],
                            sessionId,
                        });

                        // Update POAP record
                        await POAP.findByIdAndUpdate(poapRecord._id, {
                            $set: {
                                transactionHash: mintTxHash,
                                status: 'minted',
                            },
                        });
                    }
                } catch (error) {
                    logger.error(`Error processing POAP for participant ${participant._id}:`, error);
                    // Continue with other participants
                }
            }

            // Update call record
            await Call.findOneAndUpdate(
                { callId },
                {
                    $set: {
                        'custom.poap': {
                            sessionId,
                            sessionTxHash,
                            status: 'completed',
                            participantCount: eligibleParticipants.length,
                        },
                    },
                }
            );

        } catch (error) {
            logger.error('Error handling call POAP:', error);
            throw error;
        }
    }

    private static isCallEligible(call: any): boolean {
        if (!call.duration || call.duration < this.MIN_CALL_DURATION) {
            logger.info(`Call ${call.callId} duration (${call.duration}s) does not meet minimum requirement`);
            return false;
        }
        return true;
    }

    private static async getParticipantTimes(call: any): Promise<ParticipantTime[]> {
        const participantTimes: ParticipantTime[] = [];

        // Process each member's participation
        for (const member of call.members) {
            const participantEvents = call.custom?.events?.filter((event: any) =>
                event.userId === member.userId.toString() &&
                ['joined', 'left'].includes(event.type)
            ) || [];

            if (participantEvents.length >= 2) {
                const joinTime = new Date(participantEvents[0].timestamp);
                const leaveTime = new Date(participantEvents[participantEvents.length - 1].timestamp);
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

    private static async getEligibleParticipants(call: any): Promise<any[]> {
        const participantTimes = await this.getParticipantTimes(call);
        const eligibleUserIds = participantTimes
            .filter(p => p.duration >= this.MIN_PARTICIPANT_DURATION)
            .map(p => p.userId);

        return await User.find({
            _id: { $in: eligibleUserIds },
            walletAddress: { $exists: true, $ne: null },
        });
    }

    static async getUserPOAPs(userId: string): Promise<any[]> {
        return await POAP.find({ userId })
            .sort({ mintedAt: -1 })
            .populate('callId');
    }

    static async getCallPOAPs(callId: string): Promise<any[]> {
        return await POAP.find({ callId })
            .sort({ mintedAt: -1 })
            .populate('userId');
    }
}