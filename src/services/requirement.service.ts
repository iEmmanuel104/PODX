import { Call } from '../models/Mongodb/call.model';
import { User } from '../models/Mongodb/user.model';
import { BadRequestError } from '../utils/customErrors';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

interface ParticipantTime {
    userId: string;
    timeSpentMinutes: number; // duration in minutes
}

interface ParticipantEligibility {
    userId: string;
    walletAddress: string;
    username: string;
    eligible: boolean;
    timeSpentMinutes: number;
    requiredTimeMinutes: number;
}

interface RequirementCheckResult {
    eligible: boolean;
    details: {
        callTimeSpentMinutes: number;
        requiredCallTimeMinutes: number;
        participantDetails?: ParticipantEligibility[];
        totalParticipants: number;
        requiredParticipants: number;
        requirements: {
            minParticipants: boolean;
            participantDurations: boolean;
            callDuration: boolean;
        };
    };
}

interface CallDurationResult {
    eligible: boolean;
    sessionTimeMinutes: number;
    requiredTimeMinutes: number;
}

interface ParticipantEvent {
    userId: string;
    type: 'joined' | 'left';
    timestamp: string;
}

interface CallDetails {
    call: {
        members: Array<{
            userId: {
                _id: Types.ObjectId;
                walletAddress?: string;
                username?: string;
            };
        }>;
        custom?: {
            events?: ParticipantEvent[];
            durationRequirement?: {
                value: number;
            };
        };
        scheduledDuration: number;
        startTime?: Date;
        endTime?: Date;
    };
    sessionTimeMinutes: number;
    requiredDurationMinutes: number;
}

export default class RequirementService {
    // Check if the call has minimum required participants
    static async checkMinParticipants(callId: string): Promise<{
        eligible: boolean;
        totalParticipants: number;
        requiredParticipants: number;
    }> {
        try {
            const call = await Call.findOne({ callId });
            if (!call) {
                throw new BadRequestError('Call not found');
            }

            const minParticipants = Number(process.env.MIN_PARTICIPANTS) || 1;
            const actualParticipants = call.members?.length || 0;

            logger.info(`Checking min participants - Required: ${minParticipants}, Actual: ${actualParticipants}`);
            return {
                eligible: actualParticipants >= minParticipants,
                totalParticipants: actualParticipants,
                requiredParticipants: minParticipants
            };
        } catch (error) {
            logger.error('Error checking minimum participants:', error);
            return {
                eligible: false,
                totalParticipants: 0,
                requiredParticipants: Number(process.env.MIN_PARTICIPANTS) || 1
            };
        }
    }

    // Get participant details from call
    static async getParticipantDetails(callId: string): Promise<ParticipantTime[]> {
        const call = await Call.findOne({ callId })
            .populate('members.userId', 'walletAddress username');
        
        if (!call) {
            throw new BadRequestError('Call not found');
        }

        if (!call.startTime || !call.endTime) {
            throw new BadRequestError('Call timing information is incomplete');
        }

        // Calculate duration for each participant
        const participantTimes = call.members.map(member => ({
            userId: member.userId.toString(),
            timeSpentMinutes: call.duration || 0 // Using call duration as participant duration for now
        }));

        return participantTimes;
    }

    private static standardizeMinutes(milliseconds: number): number {
        return Math.floor(milliseconds / (1000 * 60));
    }

    private static calculateParticipantDuration(events: ParticipantEvent[], userId: string): number {
        let totalDuration = 0;
        let currentSessionStart: Date | null = null;
        const REJOIN_THRESHOLD_MS = 30 * 1000; // 30 seconds threshold for quick rejoin

        // Sort events by timestamp and filter for this user
        const userEvents = events
            .filter(event => event.userId === userId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Process events in sequence
        for (let i = 0; i < userEvents.length; i++) {
            const currentEvent = userEvents[i];
            const nextEvent = userEvents[i + 1];
            const currentTime = new Date(currentEvent.timestamp);
            
            if (currentEvent.type === 'joined') {
                if (!currentSessionStart) {
                    // Start new session
                    currentSessionStart = currentTime;
                }
            } else if (currentEvent.type === 'left' && currentSessionStart) {
                // Calculate time spent in this segment
                const segmentDuration = this.standardizeMinutes(
                    currentTime.getTime() - currentSessionStart.getTime()
                );
                
                // If next event isn't a quick rejoin, end the session and add duration
                if (!nextEvent || 
                    nextEvent.type !== 'joined' || 
                    new Date(nextEvent.timestamp).getTime() - currentTime.getTime() > REJOIN_THRESHOLD_MS) {
                    totalDuration += segmentDuration;
                    currentSessionStart = null;
                }
            }
        }

        logger.info('Participant duration calculation:', {
            userId,
            events: userEvents,
            totalMinutes: totalDuration
        });

        return totalDuration;
    }

    private static async getCallDetails(callId: string): Promise<CallDetails> {
        const call = await Call.findOne({ callId })
            .populate('members.userId', 'walletAddress username');
            
        if (!call) {
            throw new BadRequestError('Call not found');
        }

        if (!call.startTime) {
            throw new BadRequestError('Call has no start time');
        }

        // Calculate actual duration
        const startTime = new Date(call.startTime).getTime();
        const endTime = call.endTime ? new Date(call.endTime).getTime() : Date.now();
        const sessionTimeMinutes = this.standardizeMinutes(endTime - startTime);

        // Get required duration (percentage-based)
        const durationReq = call.custom?.durationRequirement;
        const percentage = durationReq?.value ?? 50; // Default 50%
        const requiredDurationMinutes = Math.ceil((percentage / 100) * call.scheduledDuration);

        return {
            call,
            sessionTimeMinutes,
            requiredDurationMinutes
        };
    }

    static async checkAllRequirements(callId: string): Promise<RequirementCheckResult> {
        try {
            const { call, sessionTimeMinutes, requiredDurationMinutes } = await this.getCallDetails(callId);
            
            // Check minimum participants
            const minParticipants = Number(process.env.MIN_PARTICIPANTS) || 1;
            const totalParticipants = call.members?.length || 0;
            const hasMinParticipants = totalParticipants >= minParticipants;

            // Check participant durations using events
            const participantDetails = call.members
                .filter(member => member?.userId?._id) // Filter out invalid members
                .map(member => {
                    const timeSpent = this.calculateParticipantDuration(
                        call.custom?.events || [], 
                        member.userId._id.toString()
                    );
                    return {
                        userId: member.userId._id.toString(),
                        walletAddress: member.userId.walletAddress || '',
                        username: member.userId.username || '',
                        timeSpentMinutes: timeSpent,
                        requiredTimeMinutes: requiredDurationMinutes,
                        eligible: timeSpent >= requiredDurationMinutes
                    };
                });

            const eligibleParticipants = participantDetails.filter(p => p.eligible).length;
            const hasMinEligibleParticipants = eligibleParticipants >= minParticipants;

            // Check call duration
            const hasMinDuration = sessionTimeMinutes >= requiredDurationMinutes;

            // Compile results
            const requirements = {
                minParticipants: hasMinParticipants,
                participantDurations: hasMinEligibleParticipants,
                callDuration: hasMinDuration
            };

            const eligible = Object.values(requirements).every(req => req);

            const result: RequirementCheckResult = {
                eligible,
                details: {
                    requirements,
                    participantDetails,
                    callTimeSpentMinutes: sessionTimeMinutes,
                    requiredCallTimeMinutes: requiredDurationMinutes,
                    totalParticipants,
                    requiredParticipants: minParticipants
                }
            };

            logger.info('Requirement check results:', {
                callId,
                ...result
            });

            return result;
        } catch (error) {
            logger.error('Error checking requirements', { callId, error });
            throw error;
        }
    }
}
