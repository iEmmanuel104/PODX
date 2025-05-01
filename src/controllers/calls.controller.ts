/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
// controllers/calls.controller.ts
/**
 * Controller for managing video calls using Huddle01 API integration
 * Provides endpoints for creating, retrieving, and managing call sessions
 */
import { Request, Response } from "express";
import { redisClient } from "../utils/redis";
import { BadRequestError, InternalServerError } from "../utils/customErrors";
// import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { Call } from "../models/Mongodb/call.model";
import { logger } from "../utils/logger";
import { validateDurationRequirement } from "../utils/validation";
import { PinataService } from "../services/pinata.service";
import { Huddle01Service } from "../services/huddle01.service";
import { Types } from "mongoose";
import generateCallToken, {
    TokenPermissions,
    ValidRole,
} from "../utils/generateCallToken";
import { AuthenticatedRequest } from "../middlewares/types";
import { formatCallResponse } from "../utils/responseFormat";
import { CreateCallDto } from "./dto/createCall.dto";
import { HUDDLE01_API_KEY } from "../utils/constants";
// import { GenerateTokenDto } from "./dto/generateToken.dto";

interface CallCreateData {
    roomId: string;
    title: string;
    description: string;
    type: "audio" | "video";
    hostWalletAddress: string;
    createdById: Types.ObjectId | string;
    status: "created" | "live" | "ended";
    members: Array<{
        userId: Types.ObjectId | string;
        role: string;
    }>;
    tokenGating: {
        enabled: boolean;
        type?: string;
        addresses?: string[];
    };
    ipfsUrl?: string;
    custom?: {
        durationRequirement?: {
            value: number;
            type: "percentage";
        };
    };
    isScheduled?: boolean;
    scheduledTime?: Date;
}

// Update interfaces at the top
interface IUser {
    username: string;
    walletAddress: string;
}
// interface ICall {
//     roomId: string;
//     title: string;
//     description: string;
//     type: "audio" | "video";
//     status: string;
//     members: Array<{
//         userId: IUser;
//         role: string;
//     }>;
//     tokenGating?: {
//         enabled: boolean;
//         type?: string;
//         addresses?: string[];
//     };
//     ipfsUrl?: string;
//     isActive?: boolean;
//     isPrivate?: boolean;
//     createdAt?: Date;
// }

/**
 * CallsController manages all video/audio call operations using Huddle01 API
 * Handles creation, retrieval, and management of call sessions
 */
export default class CallsController {
    /**
     * Retrieves call information by session ID
     * Returns detailed information about a specific call including member details
     * @param req Request containing sessionId parameter
     * @param res Response object
     */
    static async getCall(
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<void> {
        try {

            const { sessionId } = req.params;
    
            if (!sessionId) {
                throw new BadRequestError("Invalid sessionId");
            }
    
            // Get database call data
            const call = await Call.findOne({ roomId: sessionId })
                .lean()
                .select(
                    "roomId title description type status members tokenGating ipfsUrl createdAt isActive isPrivate isScheduled scheduledTime",
                )
                .populate("members.userId", "username walletAddress");
    
            if (!call) {
                throw new BadRequestError("Call not found");
            }
    
            // Get live participants data with error handling
            // let participants: any[] = [];
    
            // Try to get live participants, but don't fail if no session exists
            const participants = await (async (): Promise<any[]> => {
                try {
                    const huddle01Response =
                        await Huddle01Service.getLiveParticipants(sessionId);
    
                    if (huddle01Response.error) {
                        throw huddle01Response.error;
                    }
    
                    if (huddle01Response.participants) {
                        return huddle01Response.participants as Array<
                            Record<string, any>
                        >;
                    }
                } catch (participantsError) {
                    // Silently handle the error when nobody is in the room yet
                    // This catches "No ongoing session found for the room and project"
                    logger.error(`No active participants in room ${sessionId}`);
                }
    
                return [];
            })();
    
            // Find the host from the members array
            const hostMember = call.members?.find((m) => m.role === "host");
            const hostData = hostMember?.userId
                ? (hostMember.userId as unknown as IUser)
                : null;
    
            const hostInfo = hostData
                ? {
                    walletAddress: hostData.walletAddress || "",
                    username: hostData.username || "",
                }
                : null;
    
            // Format the response according to the new structure
            const formattedResponse = formatCallResponse(
                call,
                hostInfo,
                participants,
            );
    
            res.status(200).json(formattedResponse);
        } catch (error) {
            logger.error("Error retrieving call", error);
            throw error;
        }
    }

    /**
     * Creates a new video/audio call room
     * Integrates with Huddle01 API to create a new room and registers it in our database
     * Supports optional token gating to control access to the room
     * @param req Request with title, description, type, and optional token gating parameters
     * @param res Response object
     */
    static async createCall(
        req: AuthenticatedRequest & { body: CreateCallDto },
        res: Response,
    ): Promise<void> {
        try {
            const {
                title,
                description,
                type,
                tokenGatingAddresses,
                tokenGatingType,
                durationRequirement,
                isScheduled,
                scheduledTime,
            } = req.body;

            if (!title || !type || !["audio", "video"].includes(type)) {
                throw new BadRequestError("Invalid call parameters");
            }

            // Validate scheduled time if provided
            if (isScheduled && !scheduledTime) {
                throw new BadRequestError(
                    "scheduledTime is required when isScheduled is true",
                );
            }
            if (isScheduled && new Date(scheduledTime) <= new Date()) {
                throw new BadRequestError("scheduledTime must be in the future");
            }

            // Validate duration requirement if provided
            if (durationRequirement) {
                validateDurationRequirement({
                    value: durationRequirement,
                    type: "percentage",
                });
            }

            // Prepare Huddle01 metadata including schedule info
            const huddleMetadata = {
                title,
                type,
                durationRequirement: durationRequirement
                    ? {
                        value: durationRequirement,
                        type: "percentage",
                    }
                    : undefined,
                isScheduled: Boolean(isScheduled),
                scheduledTime: isScheduled
                    ? new Date(scheduledTime).toISOString()
                    : undefined,
            };

            // Prepare NFT attributes including schedule info
            const nftAttributes = [
                {
                    trait_type: "Type",
                    value: type,
                },
                {
                    trait_type: "Creator",
                    value: req.user.walletAddress,
                },
                {
                    trait_type: "Call Type",
                    value: type === "audio" ? "Audio Call" : "Video Call",
                },
                // Add duration requirement if provided
                ...(durationRequirement
                    ? [
                        {
                            trait_type: "Duration Requirement",
                            value: `${durationRequirement}%`,
                        },
                    ]
                    : []),
                // Add schedule info if scheduled
                ...(isScheduled
                    ? [
                        {
                            trait_type: "Scheduled",
                            value: "Yes",
                        },
                        {
                            trait_type: "Scheduled Time",
                            value: new Date(scheduledTime).toISOString(),
                        },
                    ]
                    : []),
            ];

            // Prepare call details for NFT metadata
            const nftCallDetails = {
                title,
                type,
                creator: req.user.walletAddress,
                creatorName: req.user.username,
                description: description || `Call: ${title}`,
                callType: type,
                tokenGating: {
                    enabled: Boolean(tokenGatingAddresses && tokenGatingType),
                    type: tokenGatingType,
                    addresses: tokenGatingAddresses,
                },
                durationRequirement: durationRequirement
                    ? {
                        value: durationRequirement,
                        type: "percentage",
                    }
                    : undefined,
                isScheduled: Boolean(isScheduled),
                scheduledTime: isScheduled
                    ? new Date(scheduledTime).toISOString()
                    : undefined,
                createdAt: new Date().toISOString(),
                platform: "Huddle01",
                version: "1.0",
            };

            // Run Huddle01 room creation and NFT metadata creation in parallel
            const [huddle01Result, nftMetadata] = await Promise.all([
                // Create Huddle01 room
                Huddle01Service.createRoom(
                    title,
                    true, // Start locked
                    huddleMetadata,
                ),
                // Create NFT metadata
                PinataService.createNFTMetadata({
                    name: title,
                    description: description || `Call: ${title}`,
                    image: req.file?.buffer || null,
                    attributes: nftAttributes,
                    callDetails: nftCallDetails,
                }),
            ]);

            // Check for errors in parallel operations
            if (huddle01Result.error || !huddle01Result.room) {
                logger.error(
                    `Huddle01 room creation failed: ${huddle01Result.error}`,
                );
                throw new InternalServerError(
                    "Unable to create Huddle01 room. Please try again later.",
                );
            }

            if (nftMetadata.error || !nftMetadata.metadataUri) {
                logger.error(`NFT metadata creation failed: ${nftMetadata.error}`);
                throw new InternalServerError(
                    "Unable to create NFT metadata. Please try again later.",
                );
            }

            // Get room ID from Huddle01 result
            const room = huddle01Result.room;

            // Create Call document with all data, including schedule info
            const callData: CallCreateData = {
                roomId: room.roomId,
                title,
                description: description || "",
                type,
                hostWalletAddress: req.user.walletAddress,
                createdById: req.user.id,
                status: "created",
                members: [{ userId: req.user.id, role: "host" }],
                tokenGating: {
                    enabled: Boolean(tokenGatingAddresses && tokenGatingType),
                    type: tokenGatingType,
                    addresses: tokenGatingAddresses,
                },
                ipfsUrl: nftMetadata.metadataUri,
                isScheduled: Boolean(isScheduled),
                scheduledTime: isScheduled ? new Date(scheduledTime) : undefined,
                custom: durationRequirement
                    ? {
                        durationRequirement: {
                            value: durationRequirement,
                            type: "percentage",
                        },
                    }
                    : undefined,
            };

            const call = await Call.create(callData);
            logger.info(`Call created with roomId: ${call.roomId}`);
            await call.populate(
                "members.userId",
                "username walletAddress displayImage",
            );

            // Format the response according to the new structure, including schedule info
            const formattedResponse = {
                status: "success",
                message: "Call created successfully",
                data: {
                    roomId: call.roomId,
                    title: call.title,
                    description: call.description,
                    type: call.type,
                    host: {
                        walletAddress: req.user.walletAddress,
                        username: req.user.username,
                    },
                    status: call.status,
                    isActive: call.isActive,
                    isPrivate: true, // Based on room creation parameter
                    tokenGating: {
                        enabled: call.tokenGating?.enabled,
                        type: call.tokenGating?.type,
                        allowedWallets: call.tokenGating?.addresses || [],
                    },
                    resources: {
                        ipfs: call.ipfsUrl,
                    },
                    durationRequirement: durationRequirement
                        ? {
                            value: durationRequirement,
                            type: "percentage",
                        }
                        : undefined,
                    isScheduled: call.isScheduled,
                    scheduledTime: call.isScheduled
                        ? call.scheduledTime?.toISOString()
                        : undefined,
                    timestamps: {
                        createdAt: call.createdAt,
                    },
                },
            };

            // Send response immediately after DB operations
            res.status(200).json(formattedResponse);
        }
        catch (error) {
            logger.error("Error creating call", error);
            throw error;
        }
    }

    /**
     * Retrieves call statistics using Huddle01 metrics API
     * Returns aggregated data about total sessions, duration, and recordings
     * @param req Request object
     * @param res Response object
     */
    static async getCallStats(req: Request, res: Response): Promise<void> {
        // Check cache first
        const cacheKey = "huddle01:metrics";
        const cachedMetrics = await redisClient.get(cacheKey);

        if (cachedMetrics) {
            // Return cached data if available
            res.status(200).json(JSON.parse(cachedMetrics));
            return;
        }

        // Get metrics directly from Huddle01 API
        const { metrics, error } = await Huddle01Service.getMetrics();
        if (error || !metrics) {
            throw new Error("Failed to retrieve metrics from Huddle01");
        }

        // Format the response
        const response = {
            status: "success",
            message: "Call stats",
            data: {
                totalSessions: metrics.totalSessions || 0,
                totalDuration: metrics.totalDuration || 0,
                recordingCount: metrics.recordingCount || 0,
                livestreamCount: metrics.livestreamCount || 0,
            },
        };

        // Cache the result for 5 minutes (300 seconds)
        await redisClient.set(cacheKey, JSON.stringify(response), "EX", 300);

        // Return response
        res.status(200).json(response);
    }

    /**
     * Gets live participants for a specific room
     * Fetches real-time information about participants currently in a call
     * Uses Huddle01 API getLiveParticipantsDetails to retrieve peer information
     * @param req Request containing roomId parameter
     * @param res Response object
     */
    static async getLiveParticipants(
        req: Request,
        res: Response,
    ): Promise<void> {
        const { roomId } = req.params;
        if (!roomId) {
            throw new BadRequestError("Room ID is required");
        }

        // Initialize empty participants array
        let participants = [];

        try {
            // Call Huddle01 API to get live participants with their details
            const result = await Huddle01Service.getLiveParticipants(roomId);
            if (!result.error && result.participants) {
                participants = result.participants;
            }
        } catch (error) {
            // Silently handle the "No ongoing session" error
            // This is not an actual error but a normal state when nobody is in the room
            logger.error(`No active participants in room ${roomId}`, error);
            throw new BadRequestError(
                `No active participants in room ${roomId}`);
        }

        // Always return a 200 success response with participants (empty array if none)
        res.status(200).json({
            status: "success",
            data: {
                participants,
            },
        });
    }

    /**
     * Generates an access token for a Huddle01 room
     * @param req Request with roomId, role, and optional permissions
     * @param res Response object
     */
    static async generateToken(
        req: AuthenticatedRequest,
        res: Response, // & { body: GenerateTokenDto },
    ): Promise<void> {
        try {

            const { roomId, role = "guest", permissions } = req.body;
    
            if (!roomId) {
                throw new BadRequestError("Room ID is required");
            }
    
            // Get call details to verify it exists
            const call = await Call.exists({ roomId });
            if (!call) {
                throw new BadRequestError(`Call with room ID ${roomId} not found`);
            }
    
            // Set default permissions based on role if not provided
            let tokenPermissions: TokenPermissions;
    
            if (!permissions) {
                // Default permissions based on role
                tokenPermissions = {
                    admin: role === "host" || role === "coHost",
                    canConsume: true,
                    canProduce: role !== "listener" && role !== "bot",
                    canProduceSources: {
                        cam:
                            role !== "speaker" &&
                            role !== "listener" &&
                            role !== "bot",
                        mic: role !== "listener" && role !== "bot",
                        screen:
                            role !== "speaker" &&
                            role !== "listener" &&
                            role !== "bot",
                    },
                    canRecvData: role !== "bot",
                    canSendData: role !== "bot",
                    canUpdateMetadata: true,
                };
            } else {
                tokenPermissions = permissions;
            }
    
            // Add metadata with user information
            const metadata = {
                walletAddress: req.user.walletAddress,
                userId: req.user.id,
                username: req.user.username,
                displayName:
                    req.user.username || req.user.walletAddress.substring(0, 10),
            };
    
            // Generate token
            const token = await generateCallToken({
                apiKey: HUDDLE01_API_KEY,
                roomId,
                role: role as ValidRole,
                permissions: tokenPermissions,
                metadata,
            });
    
            // Return success response
            res.status(200).json({
                status: "success",
                message: "Token generated successfully",
                data: {
                    token,
                    roomId,
                    role,
                    metadata,
                    expiresIn: 3600, // 1 hour expiration
                },
            });
        } catch (error) {
            logger.error("Error generating token", error);
            throw error;
        }
    }
}
