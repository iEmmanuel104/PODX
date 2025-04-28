/**
 * Huddle01 API integration for video call management
 * Provides a wrapper around the Huddle01 server-side SDK
 * Handles room creation, participant tracking, and webhook events
 */
import { API } from "@huddle01/server-sdk/api";
import { AccessToken, Role } from "@huddle01/server-sdk/auth";
import { WebhookReceiver } from "@huddle01/server-sdk/webhooks";
import { logger } from "../utils/logger";
import { Call } from "../models/Mongodb/call.model";

/**
 * Structure for webhook data received from Huddle01
 */
interface WebhookData {
    roomId: string;
    peerId?: string;
    displayName?: string;
    avatarUrl?: string;
    metadata?: Record<string, any>;
}

/**
 * Configuration and wrapper for Huddle01 API and webhook functionality
 * Provides methods to interact with Huddle01's server-side SDK
 * Handles room management, participant tracking, and webhook events
 */
export class Huddle01Config {
    private api: API;
    private webhookReceiver: WebhookReceiver;

    /**
     * Initialize the Huddle01 API and webhook receiver
     * Sets up event handlers for room lifecycle events
     */
    constructor() {
        // Initialize API client with API key from environment
        this.api = new API({
            apiKey: process.env.HUDDLE01_API_KEY!,
        });

        // Initialize webhook receiver with the same API key
        this.webhookReceiver = new WebhookReceiver({
            apiKey: process.env.HUDDLE01_API_KEY!,
        });

        // Set up webhook event handlers
        this.initializeWebhookHandlers();
    }

    /**
     * Set up handlers for Huddle01 webhook events
     * These track room lifecycle events (joined, ended) and participant events
     * Updates our database based on these events
     */
    private async initializeWebhookHandlers() {
        // Handle room.joined events (when the first participant joins)
        // @ts-expect-error - Huddle01 types are incomplete
        this.webhookReceiver.on("room.joined", async (data: WebhookData) => {
            try {
                const call = await Call.findById(data.roomId);
                if (call) {
                    if (call.status === "created") {
                        call.status = "live";
                        call.startedAt = new Date();
                    }
                    await call.save();
                }
            } catch (error) {
                logger.error("Error handling room.joined webhook:", error);
            }
        });

        // Handle room.ended events (when the room is closed)
        // @ts-expect-error - Huddle01 types are incomplete
        this.webhookReceiver.on("room.ended", async (data: WebhookData) => {
            try {
                const call = await Call.findById(data.roomId);
                if (call) {
                    call.status = "ended";
                    call.endedAt = new Date();
                    call.isActive = false;
                    if (call.startedAt) {
                        call.duration = Math.floor(
                            (Date.now() - call.startedAt.getTime()) / 1000,
                        );
                    }
                    await call.save();
                }
            } catch (error) {
                logger.error("Error handling room.ended webhook:", error);
            }
        });

        // Handle peer.joined events (when a participant joins)
        // @ts-expect-error - Huddle01 types are incomplete
        this.webhookReceiver.on("peer.joined", async (data: WebhookData) => {
            try {
                const call = await Call.findById(data.roomId);
                if (call) {
                    // Update participant information if needed
                    logger.info(
                        `Peer ${data.peerId} joined room ${data.roomId}`,
                    );
                }
            } catch (error) {
                logger.error("Error handling peer.joined webhook:", error);
            }
        });

        // Handle peer.left events (when a participant leaves)
        // @ts-expect-error - Huddle01 types are incomplete
        this.webhookReceiver.on("peer.left", async (data: WebhookData) => {
            try {
                const call = await Call.findById(data.roomId);
                if (call) {
                    // Update participant information if needed
                    logger.info(`Peer ${data.peerId} left room ${data.roomId}`);
                }
            } catch (error) {
                logger.error("Error handling peer.left webhook:", error);
            }
        });
    }

    /**
     * Creates a new Huddle01 room for hosting a video/audio call
     *
     * @param title - Title of the room to be created
     * @param roomLocked - Whether the room should be locked initially (default: true)
     * @param metadata - Optional metadata to associate with the room
     * @returns Object containing room data or error
     *
     * @example
     * const { room, error } = await huddle01Config.createRoom("Team Meeting");
     */
    async createRoom(title: string, roomLocked = true, metadata: any = {}) {
        try {
            // Call Huddle01 API to create a new room
            const room = await this.api.createRoom({
                roomLocked, // Start with room locked for security
                metadata: JSON.stringify({
                    title,
                    ...metadata,
                }),
            });
            return { room, error: null };
        } catch (error) {
            logger.error("Error creating Huddle01 room:", error);
            return { room: null, error };
        }
    }

    /**
     * Retrieves details about a specific room by its ID
     *
     * @param roomId - The unique identifier of the room
     * @returns Room details including metadata and lock status
     *
     * @example
     * const { roomDetails, error } = await huddle01Config.getRoomDetails("abc-def-ghi");
     */
    async getRoomDetails(roomId: string) {
        try {
            // Call Huddle01 API to get room details
            const roomDetails = await this.api.getRoomDetails({
                roomId,
            });
            return { roomDetails, error: null };
        } catch (error) {
            logger.error(`Error getting room details for ${roomId}:`, error);
            return { roomDetails: null, error };
        }
    }

    /**
     * Gets information about participants who are currently in a live meeting
     *
     * @param roomId - The unique identifier of the room
     * @returns List of live participants with their details
     *
     * @example
     * const { participants, error } = await huddle01Config.getLiveParticipants("abc-def-ghi");
     */
    async getLiveParticipants(roomId: string) {
        try {
            // Call Huddle01 API to get live participants
            const participants = await this.api.getLivePartipantsDetails({
                roomId,
            });
            return { participants, error: null };
        } catch (error) {
            logger.error(
                `Error getting live participants for ${roomId}:`,
                error,
            );
            return { participants: null, error };
        }
    }

    /**
     * Gets information about all rooms that are currently live
     *
     * @returns Array of live sessions with roomId, startTime, and counts
     *
     * @example
     * const { sessions, error } = await huddle01Config.getLiveSessions();
     */
    async getLiveSessions() {
        try {
            // Call Huddle01 API to get live sessions
            const sessions = await this.api.getLiveSessions();
            return { sessions, error: null };
        } catch (error) {
            logger.error("Error getting live sessions:", error);
            return { sessions: [], error };
        }
    }

    /**
     * Retrieves usage metrics for all rooms under the current API key
     *
     * @returns Metrics data for rooms under this API key
     *
     * @example
     * const { metrics, error } = await huddle01Config.getMetrics();
     */
    async getMetrics() {
        try {
            // Call Huddle01 API to get metrics
            const metrics = await this.api.getMetrics();
            return { metrics, error: null };
        } catch (error) {
            logger.error("Error getting metrics:", error);
            return { metrics: null, error };
        }
    }

    /**
     * Gets a list of all rooms created under the current API key
     *
     * @returns Array of rooms with their details
     *
     * @example
     * const { rooms, error } = await huddle01Config.getRooms();
     */
    async getRooms() {
        try {
            // Call Huddle01 API to get all rooms
            const rooms = await this.api.getRooms();
            return { rooms: rooms.rooms, error: null };
        } catch (error) {
            logger.error("Error getting rooms:", error);
            return { rooms: [], error };
        }
    }

    /**
     * Gets details about all participants who joined a specific session
     * Includes historical data, not just currently active participants
     *
     * @param sessionId - The unique identifier of the session
     * @returns List of participants with their details
     *
     * @example
     * const { participants, error } = await huddle01Config.getParticipants("session123");
     */
    async getParticipants(sessionId: string) {
        try {
            // Call Huddle01 API to get session participants
            const participants = await this.api.getPartipantsDetails({
                sessionId,
            });
            return { participants, error: null };
        } catch (error) {
            logger.error("Error getting participants:", error);
            return { participants: [], error };
        }
    }
}
