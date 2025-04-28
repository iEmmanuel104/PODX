/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable indent */
import { Request, Response } from "express";
import UserService from "../services/user.service";
import { StreakService } from "../services/streak.service";
import { TipService } from "../services/tip.service";
import { Call } from "../models/Mongodb/call.model";
import { logger } from "../utils/logger";

export const POINTS_CONFIG = {
    POINTS_PER_MINUTE: 1,
    CREATOR_BONUS_MULTIPLIER: 1.5,
    CALL_CREATION: 10,
    BONUS_THRESHOLDS: [
        { duration: 300, points: 5 }, // 5 minutes
        { duration: 900, points: 15 }, // 15 minutes
        { duration: 1800, points: 30 }, // 30 minutes
    ],
};

interface PeerJoined {
    id: string;
    sessionId: string;
    roomId: string;
    joinedAt: number;
    metadata?: string;
    role?: string;
    browser: {
        name?: string;
        version?: string;
    };
    geoData?: {
        region: string;
        country: string;
    };
    device: {
        model?: string;
        type?: string;
        vendor?: string;
    };
}

interface PeerLeft {
    id: string;
    sessionId: string;
    roomId: string;
    leftAt: number;
    duration: number;
    metadata?: string;
    role?: string;
}

export class WebhookConfig {
    static async handleHuddle01Webhook(
        req: Request,
        res: Response,
    ): Promise<void> {
        try {
            const { event, data } = req.body;

            switch (event) {
                case "peer:joined":
                    await this.handlePeerJoined(data);
                    break;
                case "peer:left":
                    await this.handlePeerLeft(data);
                    break;
                case "meeting:started":
                    await this.handleMeetingStarted(data);
                    break;
                case "meeting:ended":
                    await this.handleMeetingEnded(data);
                    break;
                case "tip.received":
                    await this.handleTipReceived(data);
                    break;
                default:
                    logger.info("Unhandled Huddle01 webhook event:", event);
            }

            res.status(200).json({ message: "Webhook processed successfully" });
        } catch (error) {
            logger.error("Error processing Huddle01 webhook:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    private static async handlePeerJoined(data: PeerJoined): Promise<void> {
        const { roomId, id: peerId, joinedAt, metadata } = data;

        try {
            // Parse metadata to extract wallet address and user info
            let walletAddress: string | undefined;
            let userId: string | undefined;

            if (metadata) {
                try {
                    const parsedMetadata = JSON.parse(metadata);
                    walletAddress = parsedMetadata.walletAddress;
                    userId = parsedMetadata.userId;
                } catch (err) {
                    logger.warn(`Failed to parse peer metadata: ${metadata}`);
                }
            }

            if (!walletAddress && !userId) {
                logger.warn(
                    `Peer joined without identifiable information: ${peerId}`,
                );
                return;
            }

            // Find or create the user if we have a wallet address
            // ! Fix this
            if (walletAddress && !userId) {
                const user =
                    // await UserService.findOrCreateByWalletAddress(
                    await UserService.findUserByWalletAddress(walletAddress);
                if (user) {
                    userId = user.id;
                }
            }

            // Update call with the join event
            if (userId) {
                await Call.findOneAndUpdate(
                    { roomId },
                    {
                        $addToSet: {
                            members: { userId, role: "guest" },
                        },
                        $push: {
                            "custom.events": {
                                userId,
                                type: "joined",
                                timestamp: new Date(joinedAt).toISOString(),
                                walletAddress,
                            },
                        },
                    },
                );

                // Also update the user's streak
                await StreakService.handleCallJoined(roomId, userId);
            }

            logger.info(
                `Peer joined: ${peerId} to room ${roomId} with wallet ${walletAddress || "unknown"}`,
            );
        } catch (error) {
            logger.error(`Error handling peer join for ${roomId}:`, error);
        }
    }

    private static async handlePeerLeft(data: PeerLeft): Promise<void> {
        const { roomId, id: peerId, leftAt, duration, metadata } = data;

        try {
            // Parse metadata to extract wallet address and user info
            let walletAddress: string | undefined;
            let userId: string | undefined;

            if (metadata) {
                try {
                    const parsedMetadata = JSON.parse(metadata);
                    walletAddress = parsedMetadata.walletAddress;
                    userId = parsedMetadata.userId;
                } catch (err) {
                    logger.warn(`Failed to parse peer metadata: ${metadata}`);
                }
            }

            if (!walletAddress && !userId) {
                logger.warn(
                    `Peer left without identifiable information: ${peerId}`,
                );
                return;
            }

            // Find the user if we have a wallet address but no userId
            if (walletAddress && !userId) {
                const user =
                    await UserService.findUserByWalletAddress(walletAddress);
                if (user) {
                    userId = user.id;
                }
            }

            // Update call with the left event
            if (userId) {
                await Call.findOneAndUpdate(
                    { roomId },
                    {
                        $push: {
                            "custom.events": {
                                userId,
                                type: "left",
                                timestamp: new Date(leftAt).toISOString(),
                                duration,
                                walletAddress,
                            },
                        },
                    },
                );
            }

            logger.info(
                `Peer left: ${peerId} from room ${roomId}, duration: ${duration}s, wallet: ${walletAddress || "unknown"}`,
            );
        } catch (error) {
            logger.error(`Error handling peer leave for ${roomId}:`, error);
        }
    }

    private static async handleMeetingStarted(data: any): Promise<void> {
        const { roomId, sessionId, createdAt } = data;

        try {
            // Update the call status and start time
            await Call.findOneAndUpdate(
                { roomId },
                {
                    status: "live",
                    startedAt: new Date(createdAt),
                    sessionId,
                },
            );

            logger.info(`Meeting started: ${roomId}, session: ${sessionId}`);
        } catch (error) {
            logger.error(`Error handling meeting start for ${roomId}:`, error);
        }
    }

    private static async handleMeetingEnded(data: any): Promise<void> {
        const { roomId, sessionId, endedAt, duration } = data;

        try {
            // Update the call status, end time and duration
            await Call.findOneAndUpdate(
                { roomId },
                {
                    status: "ended",
                    endedAt: new Date(endedAt),
                    duration: duration,
                    isActive: false,
                },
            );

            logger.info(
                `Meeting ended: ${roomId}, session: ${sessionId}, duration: ${duration}s`,
            );

            // Calculate streaks for participants
            await StreakService.handleCallEnded(roomId);
        } catch (error) {
            logger.error(`Error handling meeting end for ${roomId}:`, error);
        }
    }

    private static async handleTipReceived(data: any): Promise<void> {
        const {
            roomId,
            fromUserId,
            toUserId,
            amount,
            currency = "USDC",
            transactionHash,
        } = data;

        try {
            // Use the createTip method for consistency
            await TipService.createTip(
                roomId, // callId
                undefined, // sessionId
                fromUserId, // from user
                toUserId, // to user
                amount.toString(),
                currency,
                new Date(),
                transactionHash,
            );

            logger.info(
                `Tip received in room ${roomId}: ${amount} ${currency} from ${fromUserId} to ${toUserId}`,
            );
        } catch (error) {
            logger.error("Error handling tip received:", error);
            throw error;
        }
    }
}
