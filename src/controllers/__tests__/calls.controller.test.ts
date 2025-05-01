import request from "supertest";
import app from "../../app"; // Import your Express app
import { Call } from "../../models/Mongodb/call.model";
import { Huddle01Service } from "../../services/huddle01.service";
// import { logger } from "../../utils/logger";
import { NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { IUser } from "../../models/Mongodb/user.model";
import { PinataService } from "../../services/pinata.service";

jest.mock("@huddle01/server-sdk/auth", () => {
    return {
        AccessToken: jest.fn().mockImplementation(() => ({
            toJwt: jest.fn().mockReturnValue("mocked-jwt-token"),
        })),
        Role: {
            HOST: "HOST",
            CO_HOST: "CO_HOST",
            GUEST: "GUEST",
            SPEAKER: "SPEAKER",
            LISTENER: "LISTENER",
            BOT: "BOT",
        },
    };
});

jest.mock("../../middlewares/authMiddleware", () => ({
    basicAuth: jest.fn(
        (): ((
            req: AuthenticatedRequest,
            res: Response,
            next: NextFunction,
        ) => void) =>
            (
                req: AuthenticatedRequest,
                res: Response,
                next: NextFunction,
            ): void => {
                req.user = {
                    _id: "test-user-id",
                    walletAddress: "test-wallet-address",
                    username: "test-username",
                    ownedPods: [],
                    memberPods: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as unknown as IUser; // Mock authenticated user
                next();
            },
    ),
}));

jest.mock("../../services/pinata.service", () => ({
    PinataService: {
        createNFTMetadata: jest.fn(),
    },
}));

jest.mock("../../models/Mongodb/call.model", () => ({
    Call: {
        findOne: jest.fn(),
        create: jest.fn(),
        exists: jest.fn(),
    },
}));

jest.mock("../../services/huddle01.service", () => ({
    Huddle01Service: {
        getLiveParticipants: jest.fn(),
        createRoom: jest.fn(),
    },
}));

// Routes
const BASE_API_URL = "/api/v0/calls";
const getCallInfoSessionUrl = (sessionId: string): string =>
    `${BASE_API_URL}/info/${sessionId}`;
const getCallRoomUrl = (roomId: string, path: string): string =>
    `${BASE_API_URL}/${roomId}/${path}`;
const callCreateUrl = `${BASE_API_URL}/create`;
const callTokenUrl = `${BASE_API_URL}/token`;

describe("CallsController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /calls/info/:sessionId", () => {
        it("should return call details for a valid session ID", async () => {
            // Mock Call.findOne
            (Call.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue({
                            roomId: "12345",
                            title: "Test Call",
                            description: "A test call",
                            type: "video",
                            status: "created",
                            members: [
                                {
                                    userId: {
                                        username: "test-user",
                                        walletAddress: "0x123",
                                    },
                                    role: "host",
                                },
                            ],
                            tokenGating: { enabled: false },
                            ipfsUrl: "ipfs://test",
                            createdAt: new Date(),
                            isActive: true,
                            isPrivate: false,
                            isScheduled: false,
                            scheduledTime: null,
                        }),
                    }),
                }),
            });
            const response = await request(app)
                .get(getCallInfoSessionUrl("12345"))
                .set("Authorization", "Bearer valid_token");
            expect(response.status).toBe(200);
        });

        it("should return 400 if the session ID is not found", async () => {
            (Call.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(null),
                    }),
                }),
            });
            const response = await request(app)
                .get(getCallInfoSessionUrl("invalid-session"))
                .set("Authorization", "Bearer valid_token");
            expect(response.status).toBe(400);
        });
    });

    describe("GET /calls/:roomId/live-participants", () => {
        it("should return live participants for a valid room ID", async () => {
            // Mock Huddle01Service.getLiveParticipants
            (
                Huddle01Service.getLiveParticipants as jest.Mock
            ).mockResolvedValue({
                participants: [{ id: "peer1", name: "Test Peer" }],
            });

            const response = await request(app)
                .get(getCallRoomUrl("12345", "live-participants"))
                .set("Authorization", "Bearer valid_token");

            expect(response.status).toBe(200);
        });

        it("should return an empty array if no participants are found", async () => {
            (
                Huddle01Service.getLiveParticipants as jest.Mock
            ).mockResolvedValue({
                participants: [],
            });

            const response = await request(app)
                .get(getCallRoomUrl("12345", "live-participants"))
                .set("Authorization", "Bearer valid_token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "success",
                data: {
                    participants: [],
                },
            });
        });
    });

    describe("POST /calls/create", () => {
        it("should create a new call and return its details", async () => {
            // Mock Huddle01Service.createRoom
            (Huddle01Service.createRoom as jest.Mock).mockResolvedValue({
                room: { roomId: "12345" },
            });

            (PinataService.createNFTMetadata as jest.Mock).mockResolvedValue({
                metadataUri: "ipfs://mockedHash",
                error: null,
            });

            // Mock Call.create
            (Call.create as jest.Mock).mockResolvedValue({
                _id: "mockedCallId",
                roomId: "12345",
                title: "Test Call",
                description: "A test call",
                type: "video",
                members: [{ userId: "mockedUserId", role: "host" }],
                populate: jest.fn().mockResolvedValue({
                    _id: "mockedCallId",
                    roomId: "12345",
                    title: "Test Call",
                    description: "A test call",
                    type: "video",
                    members: [
                        {
                            userId: {
                                username: "test-user",
                                walletAddress: "0x123",
                            },
                            role: "host",
                        },
                    ],
                }),
            });

            const response = await request(app)
                .post(callCreateUrl)
                .set("Authorization", "Bearer valid_token")
                .send({
                    title: "Test Call",
                    type: "video",
                });

            expect(response.status).toBe(200);
        });

        it("should return 400 for invalid input", async () => {
            const response = await request(app)
                .post(callCreateUrl)
                .set("Authorization", "Bearer valid_token")
                .send({
                    title: "",
                    type: "invalid-type",
                });

            expect(response.status).toBe(400);
        });
    });

    describe("POST /calls/token", () => {
        it("should generate a token for a valid room ID", async () => {
            // Mock Call.findOne
            (Call.exists as jest.Mock).mockResolvedValue({
                id: "12345",
            });

            const response = await request(app)
                .post(callTokenUrl)
                .set("Authorization", "Bearer valid_token")
                .send({
                    roomId: "12345",
                    role: "host",
                });

            expect(response.status).toBe(200);
        });

        it("should return 404 if the room ID is invalid", async () => {
            (Call.exists as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post(callTokenUrl)
                .set("Authorization", "Bearer valid_token")
                .send({
                    roomId: "invalid-room",
                    role: "host",
                });

            expect(response.status).toBe(400);
        });
    });
});
