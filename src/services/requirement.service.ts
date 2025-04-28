/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Call } from "../models/Mongodb/call.model";
import { BadRequestError } from "../utils/customErrors";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

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

// interface CallDurationResult {
//     eligible: boolean;
//     sessionTimeMinutes: number;
//     requiredTimeMinutes: number;
// }

// Define the event structure as it exists in the database
interface DbEvent {
    userId: string | Types.ObjectId;
    type: string;
    timestamp: string;
    duration?: number;
    walletAddress?: string;
}

// Define the standardized event structure for our calculations
interface ParticipantEvent {
    userId: string;
    type: "joined" | "left";
    timestamp: string;
    duration?: number;
    walletAddress?: string;
}

interface CallDetails {
    call: any; // Using any to avoid type mismatches with the real DB model
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
            const call = await Call.findOne({ roomId: callId });
            if (!call) {
                throw new BadRequestError("Call not found");
            }

            const minParticipants = Number(process.env.MIN_PARTICIPANTS) || 1;
            const actualParticipants = call.members?.length || 0;

            logger.info(
                `Checking min participants - Required: ${minParticipants}, Actual: ${actualParticipants}`,
            );
            return {
                eligible: actualParticipants >= minParticipants,
                totalParticipants: actualParticipants,
                requiredParticipants: minParticipants,
            };
        } catch (error) {
            logger.error("Error checking minimum participants:", error);
            return {
                eligible: false,
                totalParticipants: 0,
                requiredParticipants: Number(process.env.MIN_PARTICIPANTS) || 1,
            };
        }
    }

    // Get participant details from call
    static async getParticipantDetails(
        callId: string,
    ): Promise<ParticipantTime[]> {
        const call = await Call.findOne({ roomId: callId }).populate(
            "members.userId",
            "walletAddress username",
        );

        if (!call) {
            throw new BadRequestError("Call not found");
        }

        if (!call.startedAt || !call.endedAt) {
            throw new BadRequestError("Call timing information is incomplete");
        }

        // Calculate duration for each participant using events
        const participantTimes: ParticipantTime[] = [];

        if (call.custom?.events && call.custom.events.length > 0) {
            // Group events by userId
            const eventsByUser = call.custom.events.reduce(
                (acc: Record<string, ParticipantEvent[]>, event: DbEvent) => {
                    const userId =
                        typeof event.userId === "string"
                            ? event.userId
                            : event.userId.toString();

                    if (!acc[userId]) {
                        acc[userId] = [];
                    }

                    // Convert event to match ParticipantEvent interface
                    const typedEvent: ParticipantEvent = {
                        userId,
                        type: event.type as "joined" | "left",
                        timestamp: event.timestamp,
                        duration: event.duration,
                        walletAddress: event.walletAddress,
                    };

                    acc[userId].push(typedEvent);
                    return acc;
                },
                {},
            );

            // Calculate duration for each user
            for (const userId in eventsByUser) {
                const userEvents = eventsByUser[userId];
                const timeSpent = this.calculateParticipantDuration(
                    userEvents,
                    userId,
                );
                participantTimes.push({
                    userId,
                    timeSpentMinutes: timeSpent,
                });
            }
        } else {
            // Fallback if no events are recorded
            participantTimes.push(
                ...call.members.map((member: any) => ({
                    userId: member.userId.toString(),
                    timeSpentMinutes: call.duration
                        ? Math.floor(call.duration / 60)
                        : 0, // Convert seconds to minutes
                })),
            );
        }

        return participantTimes;
    }

    private static standardizeMinutes(milliseconds: number): number {
        return Math.floor(milliseconds / (1000 * 60));
    }

    private static calculateParticipantDuration(
        events: ParticipantEvent[],
        userId: string,
    ): number {
        let totalDuration = 0;
        let currentSessionStart: Date | null = null;
        const REJOIN_THRESHOLD_MS = 30 * 1000; // 30 seconds threshold for quick rejoin

        // Sort events by timestamp and filter for this user
        const userEvents = events
            .filter((event) => event.userId === userId)
            .sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
            );

        // Process events in sequence
        for (let i = 0; i < userEvents.length; i++) {
            const currentEvent = userEvents[i];
            const nextEvent = userEvents[i + 1];
            const currentTime = new Date(currentEvent.timestamp);

            if (currentEvent.type === "joined") {
                if (!currentSessionStart) {
                    // Start new session
                    currentSessionStart = currentTime;
                }
            } else if (currentEvent.type === "left" && currentSessionStart) {
                // Calculate time spent in this segment
                const segmentDuration = this.standardizeMinutes(
                    currentTime.getTime() - currentSessionStart.getTime(),
                );

                // If next event isn't a quick rejoin, end the session and add duration
                if (
                    !nextEvent ||
                    nextEvent.type !== "joined" ||
                    new Date(nextEvent.timestamp).getTime() -
                        currentTime.getTime() >
                        REJOIN_THRESHOLD_MS
                ) {
                    totalDuration += segmentDuration;
                    currentSessionStart = null;
                }
            }
        }

        logger.info("Participant duration calculation:", {
            userId,
            events: userEvents,
            totalMinutes: totalDuration,
        });

        return totalDuration;
    }

    private static async getCallDetails(callId: string): Promise<CallDetails> {
        const call = await Call.findOne({ roomId: callId }).populate(
            "members.userId",
            "walletAddress username",
        );

        if (!call) {
            throw new BadRequestError("Call not found");
        }

        if (!call.startedAt) {
            throw new BadRequestError("Call has no start time");
        }

        // Calculate actual duration
        const startTime = new Date(call.startedAt).getTime();
        const endTime = call.endedAt
            ? new Date(call.endedAt).getTime()
            : Date.now();
        const sessionTimeMinutes = this.standardizeMinutes(endTime - startTime);

        // Get scheduled duration or use actual duration if not scheduled
        const scheduledDuration = call.scheduledTime
            ? Math.ceil(
                (new Date(call.scheduledTime).getTime() - startTime) /
                    (60 * 1000),
            )
            : sessionTimeMinutes;

        // Get required duration based on the durationRequirement or default to 50%
        const durationReq = call.custom?.durationRequirement;
        let requiredDurationMinutes = 0;

        if (durationReq) {
            if (durationReq.type === "absolute") {
                // For absolute type, use the value directly as minutes
                requiredDurationMinutes = durationReq.value;
            } else {
                // For percentage type, calculate based on scheduled or actual duration
                const percentage = durationReq.value;
                requiredDurationMinutes = Math.ceil(
                    (percentage / 100) * scheduledDuration,
                );
            }
        } else {
            // Default to 50% if no requirement is set
            requiredDurationMinutes = Math.ceil(0.5 * scheduledDuration);
        }

        return {
            call,
            sessionTimeMinutes,
            requiredDurationMinutes,
        };
    }

    static async checkAllRequirements(
        callId: string,
    ): Promise<RequirementCheckResult> {
        try {
            const { call, sessionTimeMinutes, requiredDurationMinutes } =
                await this.getCallDetails(callId);

            // Check minimum participants
            const minParticipants = Number(process.env.MIN_PARTICIPANTS) || 1;
            const totalParticipants = call.members?.length || 0;
            const hasMinParticipants = totalParticipants >= minParticipants;

            // Check participant durations using events
            const participantDetails = call.members
                .filter((member: any) => member?.userId?._id) // Filter out invalid members
                .map((member: any) => {
                    const userId = member.userId._id.toString();

                    // Map and convert the events to the expected format
                    const convertedEvents: ParticipantEvent[] = [];
                    if (call.custom?.events) {
                        call.custom.events.forEach((event: any) => {
                            if (event) {
                                const eventUserId =
                                    event.userId &&
                                    typeof event.userId !== "string"
                                        ? event.userId.toString()
                                        : event.userId;

                                convertedEvents.push({
                                    userId: eventUserId,
                                    type: event.type as "joined" | "left",
                                    timestamp: event.timestamp,
                                    duration: event.duration,
                                    walletAddress: event.walletAddress,
                                });
                            }
                        });
                    }

                    const timeSpent = this.calculateParticipantDuration(
                        convertedEvents,
                        userId,
                    );

                    return {
                        userId,
                        walletAddress: member.userId.walletAddress || "",
                        username: member.userId.username || "",
                        timeSpentMinutes: timeSpent,
                        requiredTimeMinutes: requiredDurationMinutes,
                        eligible: timeSpent >= requiredDurationMinutes,
                    };
                });

            const eligibleParticipants = participantDetails.filter(
                (p: ParticipantEligibility) => p.eligible,
            ).length;
            const hasMinEligibleParticipants =
                eligibleParticipants >= minParticipants;

            // Check call duration
            const hasMinDuration =
                sessionTimeMinutes >= requiredDurationMinutes;

            // Compile results
            const requirements = {
                minParticipants: hasMinParticipants,
                participantDurations: hasMinEligibleParticipants,
                callDuration: hasMinDuration,
            };

            const eligible = Object.values(requirements).every((req) => req);

            const result: RequirementCheckResult = {
                eligible,
                details: {
                    requirements,
                    participantDetails,
                    callTimeSpentMinutes: sessionTimeMinutes,
                    requiredCallTimeMinutes: requiredDurationMinutes,
                    totalParticipants,
                    requiredParticipants: minParticipants,
                },
            };

            logger.info("Requirement check results:", {
                callId,
                ...result,
            });

            return result;
        } catch (error) {
            logger.error("Error checking requirements", { callId, error });
            throw error;
        }
    }
}
