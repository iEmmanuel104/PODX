/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable indent */
import { Call } from "../models/Mongodb/call.model";
import { StreakService } from "./streak.service";
import { Huddle01Service } from "./huddle01.service";
import { POAPService } from "./poap.service";
import { logger } from "../utils/logger";
import { User } from "../models/Mongodb/user.model";
import { Types } from "mongoose";

export class CallService {
    // Constants
    private static readonly WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

    // Create a new call
    static async createCall(
        userId: string,
        title: string,
        type: "audio" | "video",
        tokenGateInfo?: {
            type: "internal" | "external";
            internal?: { pastRoomTitles?: string[] };
            external?: { allowedWallets?: string[] };
        },
        durationRequirement?: {
            value: number;
            type: "percentage";
        },
    ) {
        try {
            // Create Huddle01 room with metadata including duration requirement
            const { room, error } = await Huddle01Service.createRoom(
                title,
                true,
                {
                    roomType: type,
                    durationRequirement,
                },
            );

            if (error || !room) {
                throw new Error(`Failed to create Huddle01 room: ${error}`);
            }

            // Get user details
            const user = await User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }

            // Create call document
            const call = await Call.create({
                roomId: room.roomId,
                title,
                type,
                hostWalletAddress: user.walletAddress,
                createdById: user._id,
                status: "created",
                members: [{ userId: user._id, role: "host" }],
                custom: {
                    roomType: type,
                    tokenGateInfo: tokenGateInfo
                        ? {
                              enabled: true,
                              ...tokenGateInfo,
                          }
                        : undefined,
                    durationRequirement,
                },
            });

            return { call, room };
        } catch (error) {
            logger.error("Error creating call:", error);
            throw error;
        }
    }

    // Get call details
    static async getCallDetails(callId: string) {
        try {
            const { room, error } =
                await Huddle01Service.getRoomDetails(callId);
            if (error || !room) {
                throw new Error(`Failed to get room details: ${error}`);
            }

            const call = await Call.findOne({ roomId: callId })
                .populate("createdById", "username walletAddress displayImage")
                .populate(
                    "members.userId",
                    "username walletAddress displayImage",
                );

            if (!call) {
                throw new Error("Call not found");
            }

            const { participants } =
                await Huddle01Service.getLiveParticipants(callId);

            return {
                call,
                room,
                liveParticipants: participants,
            };
        } catch (error) {
            logger.error("Error getting call details:", error);
            throw error;
        }
    }

    // Get live sessions
    static async getLiveSessions() {
        try {
            const { sessions, error } = await Huddle01Service.getLiveSessions();

            if (error) {
                throw new Error(`Failed to get live sessions: ${error}`);
            }

            return sessions;
        } catch (error) {
            logger.error("Error getting live sessions:", error);
            throw error;
        }
    }

    // Get metrics
    static async getMetrics() {
        try {
            const { metrics, error } = await Huddle01Service.getMetrics();

            if (error) {
                throw new Error(`Failed to get metrics: ${error}`);
            }

            return metrics;
        } catch (error) {
            logger.error("Error getting metrics:", error);
            throw error;
        }
    }

    // Get all rooms
    static async getRooms() {
        try {
            const { rooms, error } = await Huddle01Service.getRooms();

            if (error) {
                throw new Error(`Failed to get rooms: ${error}`);
            }

            return rooms;
        } catch (error) {
            logger.error("Error getting rooms:", error);
            throw error;
        }
    }

    // Get participants for a session
    static async getParticipants(sessionId: string) {
        try {
            const { participants, error } =
                await Huddle01Service.getParticipants(sessionId);

            if (error) {
                throw new Error(`Failed to get participants: ${error}`);
            }

            return participants;
        } catch (error) {
            logger.error("Error getting participants:", error);
            throw error;
        }
    }

    // Verify token gate access
    static async verifyTokenGateAccess(roomId: string, walletAddress: string) {
        try {
            // Get room details first
            const call = await Call.findOne({ roomId });

            if (!call) {
                throw new Error("Call not found");
            }

            const tokenGateInfo = call.custom?.tokenGateInfo;

            // If no token gating, allow access
            if (!tokenGateInfo || !tokenGateInfo.enabled) {
                return { hasAccess: true };
            }

            // Check based on token gate type
            if (tokenGateInfo.type === "external") {
                // Check if wallet is in allowed list
                const allowedWallets =
                    tokenGateInfo.external?.allowedWallets || [];
                return {
                    hasAccess: allowedWallets.includes(walletAddress),
                    reason: "wallet-list",
                };
            } else if (tokenGateInfo.type === "internal") {
                // Check if user has attended required past meetings
                const user = await User.findOne({ walletAddress });

                if (!user) {
                    return { hasAccess: false, reason: "user-not-found" };
                }

                // Implement contract verification logic here for the user's wallet
                // This would verify if they have the required meeting POAPs

                return { hasAccess: true, reason: "contract-verification" };
            }

            return { hasAccess: false, reason: "unknown-gate-type" };
        } catch (error) {
            logger.error("Error verifying token gate access:", error);
            throw error;
        }
    }

    // Generate access token
    static generateAccessToken(roomId: string, userId: string) {
        try {
            const { token, error } = Huddle01Service.generateAccessToken(
                roomId,
                userId,
            );

            if (error || !token) {
                throw new Error(`Failed to generate access token: ${error}`);
            }

            return { token };
        } catch (error) {
            logger.error("Error generating access token:", error);
            throw error;
        }
    }

    // Process Huddle01 webhooks
    static async processHuddle01Webhook(
        eventType: string,
        payload: any,
    ): Promise<void> {
        try {
            switch (eventType) {
                case "meeting:started":
                    await this.handleMeetingStarted(payload);
                    break;
                case "meeting:ended":
                    await this.handleMeetingEnded(payload);
                    break;
                case "peer:joined":
                    await this.handlePeerJoined(payload);
                    break;
                case "peer:left":
                    await this.handlePeerLeft(payload);
                    break;
                case "recording:started":
                case "recording:stopped":
                case "recording:updated":
                    // Handle recording events if needed
                    break;
            }
        } catch (error) {
            logger.error(
                `Error processing Huddle01 webhook event ${eventType}:`,
                error,
            );
            throw error;
        }
    }

    // Handle meeting started event
    private static async handleMeetingStarted(payload: {
        sessionId: string;
        roomId: string;
        createdAt: number;
    }) {
        const { sessionId, roomId, createdAt } = payload;

        try {
            // Update call status
            await Call.findOneAndUpdate(
                { roomId },
                {
                    sessionId,
                    status: "live",
                    startTime: new Date(createdAt),
                },
            );

            logger.info(`Meeting started: ${roomId}, session: ${sessionId}`);
        } catch (error) {
            logger.error(`Error handling meeting start for ${roomId}:`, error);
            throw error;
        }
    }

    // Handle meeting ended event
    private static async handleMeetingEnded(payload: {
        sessionId: string;
        roomId: string;
        createdAt: number;
        endedAt: number;
        duration: number;
        participants: number;
    }) {
        const { sessionId, roomId, endedAt, duration, participants } = payload;

        try {
            // Update call status
            const call = await Call.findOneAndUpdate(
                { roomId },
                {
                    status: "ended",
                    endTime: new Date(endedAt),
                    duration,
                },
                { new: true },
            );

            if (!call) {
                throw new Error(`Call ${roomId} not found`);
            }

            // Update streaks for all participants
            const memberIds = call.members.map((member) => member.userId);

            for (const userId of memberIds) {
                await StreakService.updateUserStreakStats(userId.toString());
            }

            // Handle POAP if more than one participant
            if (participants > 1) {
                try {
                    await POAPService.handleCallPOAP(roomId);
                    logger.info(
                        `POAP distribution initiated for call ${roomId}`,
                    );
                } catch (error) {
                    logger.error("Error handling POAP for call:", error);
                }
            }

            logger.info(
                `Meeting ended: ${roomId}, session: ${sessionId}, duration: ${duration}`,
            );
        } catch (error) {
            logger.error(`Error handling meeting end for ${roomId}:`, error);
            throw error;
        }
    }

    // Handle peer joined event
    private static async handlePeerJoined(payload: {
        id: string;
        sessionId: string;
        roomId: string;
        joinedAt: number;
        metadata?: string;
    }) {
        const { id: peerId, roomId, joinedAt, metadata } = payload;

        try {
            // Parse metadata to get user information
            let userId;

            if (metadata) {
                try {
                    const parsedMetadata = JSON.parse(metadata);
                    userId = parsedMetadata.userId;
                } catch (err) {
                    logger.warn(`Failed to parse peer metadata: ${metadata}`);
                }
            }

            if (!userId) {
                logger.warn(
                    `Peer joined without userId in metadata: ${peerId}`,
                );
                return;
            }

            // Update call members
            await Call.findOneAndUpdate(
                {
                    roomId,
                    "members.userId": { $ne: userId }, // Only add if not already a member
                },
                {
                    $addToSet: {
                        members: { userId, role: "guest" },
                    },
                    $push: {
                        "custom.events": {
                            userId,
                            type: "joined",
                            timestamp: new Date(joinedAt).toISOString(),
                        },
                    },
                },
            );

            logger.info(`Peer joined: ${peerId} to room ${roomId}`);
        } catch (error) {
            logger.error(`Error handling peer join for ${roomId}:`, error);
            throw error;
        }
    }

    // Handle peer left event
    private static async handlePeerLeft(payload: {
        id: string;
        sessionId: string;
        roomId: string;
        leftAt: number;
        duration: number;
        metadata?: string;
    }) {
        const { id: peerId, roomId, leftAt, duration, metadata } = payload;

        try {
            // Parse metadata to get user information
            let userId;

            if (metadata) {
                try {
                    const parsedMetadata = JSON.parse(metadata);
                    userId = parsedMetadata.userId;
                } catch (err) {
                    logger.warn(`Failed to parse peer metadata: ${metadata}`);
                }
            }

            if (!userId) {
                logger.warn(`Peer left without userId in metadata: ${peerId}`);
                return;
            }

            // Update call events
            await Call.findOneAndUpdate(
                { roomId },
                {
                    $push: {
                        "custom.events": {
                            userId,
                            type: "left",
                            timestamp: new Date(leftAt).toISOString(),
                            duration,
                        },
                    },
                },
            );

            // Update user streak if call long enough
            if (duration >= 60) {
                // At least 1 minute
                await StreakService.updateUserStreakStats(userId);
            }

            logger.info(
                `Peer left: ${peerId} from room ${roomId}, duration: ${duration}s`,
            );
        } catch (error) {
            logger.error(`Error handling peer leave for ${roomId}:`, error);
            throw error;
        }
    }

    // For backward compatibility - will be removed after full migration
    static processWebhook(eventType: string): void {
        try {
            // Log deprecated usage
            logger.warn(`Using deprecated StreamIO webhook: ${eventType}`);

            // Just return - we're phasing this out
            return;
        } catch (error) {
            logger.error(`Error processing webhook event ${eventType}:`, error);
            throw error;
        }
    }

    async handleParticipantJoined(
        roomId: string,
        peerId: string,
        displayName: string,
    ) {
        try {
            const call = await Call.findOne({ roomId });
            if (!call) {
                throw new Error("Call not found");
            }

            const user = await User.findOne({ displayName });
            if (!user) {
                throw new Error("User not found");
            }

            // Ensure we have a valid ID by checking if it exists
            if (!user._id) {
                throw new Error("User has no valid ID");
            }

            // Safely convert to string
            const userId = String(user._id);

            // Check if user is already a member (using string comparison)
            const memberIds = call.members.map((member) =>
                String(member.userId),
            );

            if (!memberIds.includes(userId)) {
                // Add to members array
                call.members.push({
                    userId: new Types.ObjectId(userId),
                    role: "guest",
                });
                await call.save();
                logger.info(`User ${displayName} joined call ${roomId}`);
            }
        } catch (error) {
            logger.error("Error handling participant joined:", error);
            throw error;
        }
    }

    async handleParticipantLeft(roomId: string, peerId: string) {
        try {
            const call = await Call.findOne({ roomId });
            if (!call) {
                throw new Error("Call not found");
            }

            // For this version, we'll use a simplified approach
            // until we have more information about how Huddle01
            // provides participant metadata
            logger.info(`Participant ${peerId} left call ${roomId}`);

            // Mark call as ended if it was the last participant
            if (call.members.length <= 1) {
                await this.handleCallEnded(roomId);
            }
        } catch (error) {
            logger.error("Error handling participant left:", error);
            throw error;
        }
    }

    async handleCallEnded(roomId: string) {
        try {
            const call = await Call.findOne({ roomId });
            if (!call) {
                throw new Error("Call not found");
            }

            // Set call as inactive and record end time
            call.isActive = false;
            call.endedAt = new Date();

            if (call.startedAt && call.endedAt) {
                // Calculate duration in seconds
                const durationMs =
                    call.endedAt.getTime() - call.startedAt.getTime();
                call.duration = Math.floor(durationMs / 1000);
            }

            await call.save();

            logger.info(`Call ${roomId} ended`);
        } catch (error) {
            logger.error("Error handling call ended:", error);
            throw error;
        }
    }

    private static async calculateStreakData(userId: string): Promise<{
        currentStreak: number;
        longestStreak: number;
        streakHistory: Array<{ date: Date; streak: number }>;
        lastActivityDate?: Date;
    }> {
        const calls = await Call.find({
            $or: [{ createdById: userId }, { "members.userId": userId }],
            status: "ended",
            endedAt: { $exists: true },
        }).sort({ endedAt: 1 });

        let currentStreak = 0;
        let longestStreak = 0;
        let lastActivityDate: Date | null = null;
        const streakHistory: Array<{ date: Date; streak: number }> = [];
        const processedDates = new Set<string>();

        for (const call of calls) {
            if (!call.endedAt) continue;

            const dateStr = call.endedAt.toISOString().split("T")[0];
            if (processedDates.has(dateStr)) continue;
            processedDates.add(dateStr);

            const callDate = call.endedAt;

            if (!lastActivityDate) {
                currentStreak = 1;
                lastActivityDate = callDate;
            } else {
                const timeDiff =
                    callDate.getTime() - lastActivityDate.getTime();

                if (timeDiff > this.WEEK_IN_MS) {
                    currentStreak = 1;
                } else {
                    const daysDiff = Math.floor(
                        timeDiff / (24 * 60 * 60 * 1000),
                    );
                    if (daysDiff === 1) {
                        currentStreak++;
                    } else if (daysDiff > 1) {
                        currentStreak = 1;
                    }
                }
                lastActivityDate = callDate;
            }

            longestStreak = Math.max(longestStreak, currentStreak);
            streakHistory.push({ date: callDate, streak: currentStreak });
        }

        return {
            currentStreak,
            longestStreak,
            streakHistory,
            lastActivityDate: lastActivityDate || undefined,
        };
    }
}
