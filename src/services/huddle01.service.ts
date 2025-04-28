/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Service for interacting with the Huddle01 API
 * Provides methods for room management, participant tracking, and metrics
 * Integrates with Huddle01's server-side SDK
 */
import { API } from "@huddle01/server-sdk/api";
import { logger } from "../utils/logger";
import { HUDDLE01_API_KEY } from "../utils/constants";

export class Huddle01Service {
    private static api: API;
    private static cache: Map<string, { data: any; timestamp: number }> =
        new Map();
    private static CACHE_TTL = 30000; // 30 seconds

    static {
        this.api = new API({
            apiKey: HUDDLE01_API_KEY,
        });
    }

    private static getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data as T;
        }
        return null;
    }

    private static setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Creates a new Huddle01 room for hosting a video/audio call
     *
     * @param title Title of the room to be created
     * @param metadata Optional metadata to associate with the room
     * @returns Object containing room data or error
     *
     * @example
     * // Creates a room with the title "Team Meeting"
     * const { room, error } = await Huddle01Service.createRoom("Team Meeting");
     * // Access room ID: room.roomId
     */
    static async createRoom(
        title: string,
        isPrivate: boolean = true,
        custom: Record<string, any> = {},
    ) {
        try {
            const newRoom = await this.api.createRoom({
                roomLocked: isPrivate,
                metadata: JSON.stringify({
                    title,
                    ...custom,
                }),
            });

            return {
                room: newRoom,
                error: null,
            };
        } catch (error) {
            logger.error("Error creating Huddle01 room:", error);
            return {
                room: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create room",
            };
        }
    }

    /**
     * Retrieves details about a specific room by its ID
     *
     * @param roomId The unique identifier of the room
     * @returns Room details including metadata and lock status
     *
     * @example
     * const { room, error } = await Huddle01Service.getRoomDetails("abc-def-ghi");
     */
    static async getRoomDetails(roomId: string) {
        try {
            // Check cache first
            const cacheKey = `room:${roomId}`;
            const cached = this.getCached<any>(cacheKey);
            if (cached) {
                return {
                    room: cached,
                    error: null,
                };
            }

            const roomDetails = await this.api.getRoomDetails({
                roomId,
            });

            // Cache the result
            this.setCache(cacheKey, roomDetails);

            return {
                room: roomDetails,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting room details:", error);
            return {
                room: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get room details",
            };
        }
    }

    /**
     * Gets information about participants who are currently in a live meeting
     *
     * @param roomId The unique identifier of the room
     * @returns List of live participants with their details
     *
     * @example
     * const { participants, error } = await Huddle01Service.getLiveParticipants("abc-def-ghi");
     * // participants includes peerId, joinTime, metadata, etc.
     */
    static async getLiveParticipants(roomId: string) {
        try {
            // Check cache first
            const cacheKey = `participants:${roomId}`;
            const cached = this.getCached<any>(cacheKey);
            if (cached) {
                return {
                    participants: cached,
                    error: null,
                };
            }

            const participants = await this.api.getLivePartipantsDetails({
                roomId,
            });

            // Cache the result
            this.setCache(cacheKey, participants);

            return {
                participants,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting live participants:", error);
            return {
                participants: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get live participants",
            };
        }
    }

    /**
     * Gets information about all rooms that are currently live
     *
     * @returns Array of live sessions with roomId, startTime, and counts
     *
     * @example
     * const { sessions, error } = await Huddle01Service.getLiveSessions();
     * // Each session includes roomId, startTime, livestreamCount, recordingCount
     */
    static async getLiveSessions() {
        try {
            // Check cache first
            const cacheKey = "live-sessions";
            const cached = this.getCached<any>(cacheKey);
            if (cached) {
                return {
                    sessions: cached,
                    error: null,
                };
            }

            const sessions = await this.api.getLiveSessions();

            // Cache the result
            this.setCache(cacheKey, sessions);

            return {
                sessions,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting live sessions:", error);
            return {
                sessions: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get live sessions",
            };
        }
    }

    /**
     * Retrieves usage metrics for all rooms under the current API key
     * Includes total duration, total users, recording counts, etc.
     *
     * @returns Metrics data for rooms under this API key
     *
     * @example
     * const { metrics, error } = await Huddle01Service.getMetrics();
     * // metrics includes totalSessions, totalDuration, totalUsers, etc.
     */
    static async getMetrics() {
        try {
            const metrics = await this.api.getMetrics();

            return {
                metrics,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting metrics:", error);
            return {
                metrics: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get metrics",
            };
        }
    }

    /**
     * Gets a list of all rooms created under the current API key
     *
     * @returns Array of rooms with their details
     *
     * @example
     * const { rooms, error } = await Huddle01Service.getRooms();
     * // Each room includes roomId, createdAt, roomLocked, metadata
     */
    static async getRooms() {
        try {
            const rooms = await this.api.getRooms();

            return {
                rooms: rooms.rooms,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting rooms:", error);
            return {
                rooms: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get rooms",
            };
        }
    }

    /**
     * Gets all sessions (meetings) for a specific room
     *
     * @param roomId The unique identifier of the room
     * @returns Array of sessions with their details
     *
     * @example
     * const { sessions, error } = await Huddle01Service.getRoomSessions("abc-def-ghi");
     * // Each session includes sessionId, startTime, endTime
     */
    static async getRoomSessions(roomId: string) {
        try {
            const cacheKey = `roomSessions:${roomId}`;
            const cached = this.getCached<any>(cacheKey);
            if (cached) {
                return { sessions: cached, error: null };
            }

            // Get sessions data from Huddle01 API
            const response = await this.api.getRoomSessions({
                roomId,
            });

            // Extract sessions array from response
            // This handles the API response structure properly
            // Cast the response to any to handle the API's structure
            const sessionsList = (response as any).sessions || [];

            // Cache the result
            this.setCache(cacheKey, sessionsList);

            return { sessions: sessionsList, error: null };
        } catch (error) {
            logger.error(`Error getting room sessions for ${roomId}:`, error);
            return { sessions: [], error };
        }
    }

    /**
     * Gets details about all participants who joined a specific session
     * Includes historical data, not just currently active participants
     *
     * @param sessionId The unique identifier of the session
     * @returns List of participants with their details
     *
     * @example
     * const { participants, error } = await Huddle01Service.getParticipants("session123");
     * // Each participant includes peerId, joinTime, exitTime, metadata
     */
    static async getParticipants(sessionId: string) {
        try {
            const participants = await this.api.getPartipantsDetails({
                sessionId,
            });

            return {
                participants: participants,
                error: null,
            };
        } catch (error) {
            logger.error("Error getting participants:", error);
            return {
                participants: [],
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to get participants",
            };
        }
    }

    /**
     * Generates an access token for a user to join a specific room
     *
     * @param roomId The unique identifier of the room
     * @param userId The unique identifier of the user
     * @param walletAddress Optional wallet address for the user
     * @returns Access token for joining the room
     */
    static generateAccessToken(roomId: string, userId: string) {
        try {
            // Access token does not need caching as it's typically used once
            // Since getAccessToken is not available, we'll use a different approach
            // This is a placeholder for the actual implementation
            logger.info(
                `Generating access token for user ${userId} in room ${roomId}`,
            );

            // Return a mock token for now - implement properly when SDK supports it
            return {
                token: `mock_token_${roomId}_${userId}_${Date.now()}`,
                error: null,
            };
        } catch (error) {
            logger.error("Error generating access token:", error);
            return {
                token: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate access token",
            };
        }
    }

    /**
     * Records that a room has ended
     * Note: Actual room ending is handled through Huddle01 webhooks
     * This method is primarily for updating our internal state
     *
     * @param roomId The unique identifier of the room
     * @returns Success or error status
     */
    static endRoom(roomId: string) {
        try {
            // Room ending in Huddle01 is handled through webhooks
            // This method is for logging purposes and future extensions
            logger.info(`Room ${roomId} marked as ended`);
            return { success: true, error: null };
        } catch (error) {
            logger.error(`Error ending room ${roomId}:`, error);
            return { success: false, error };
        }
    }
}
