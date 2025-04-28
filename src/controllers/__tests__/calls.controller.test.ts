import request from "supertest";
import app from "../../app"; // Import your Express app
import { Call } from "../../models/Mongodb/call.model";
import { Huddle01Service } from "../../services/huddle01.service";

jest.mock("../../models/Mongodb/call.model", () => ({
    Call: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock("../../services/huddle01.service", () => ({
    Huddle01Service: {
        getLiveParticipants: jest.fn(),
        createRoom: jest.fn(),
    },
}));

describe("CallsController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /calls/info/:sessionId", () => {
        it("should return call details for a valid session ID", async () => {
            // Mock Call.findOne
            (Call.findOne as jest.Mock).mockResolvedValue({
                roomId: "12345",
                title: "Test Call",
                description: "A test call",
                type: "video",
                status: "created",
                members: [],
            });

            const response = await request(app)
                .get("/calls/info/12345")
                .set("Authorization", "Bearer valid_token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "success",
                data: {
                    roomId: "12345",
                    title: "Test Call",
                    description: "A test call",
                    type: "video",
                    status: "created",
                    members: [],
                },
            });
        });

        it("should return 404 if the session ID is not found", async () => {
            (Call.findOne as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get("/calls/info/invalid-session")
                .set("Authorization", "Bearer valid_token");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                status: "error",
                message: "Call not found",
            });
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
                .get("/calls/12345/live-participants")
                .set("Authorization", "Bearer valid_token");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "success",
                data: {
                    participants: [{ id: "peer1", name: "Test Peer" }],
                },
            });
        });

        it("should return an empty array if no participants are found", async () => {
            (
                Huddle01Service.getLiveParticipants as jest.Mock
            ).mockResolvedValue({
                participants: [],
            });

            const response = await request(app)
                .get("/calls/12345/live-participants")
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

            // Mock Call.create
            (Call.create as jest.Mock).mockResolvedValue({
                roomId: "12345",
                title: "Test Call",
                description: "A test call",
                type: "video",
                status: "created",
                members: [],
            });

            const response = await request(app)
                .post("/calls/create")
                .set("Authorization", "Bearer valid_token")
                .send({
                    title: "Test Call",
                    type: "video",
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "success",
                message: "Call created successfully",
                data: {
                    roomId: "12345",
                    title: "Test Call",
                    description: "A test call",
                    type: "video",
                    status: "created",
                    members: [],
                },
            });
        });

        it("should return 400 for invalid input", async () => {
            const response = await request(app)
                .post("/calls/create")
                .set("Authorization", "Bearer valid_token")
                .send({
                    title: "",
                    type: "invalid-type",
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                status: "error",
                message: "Invalid call parameters",
            });
        });
    });

    describe("POST /calls/token", () => {
        it("should generate a token for a valid room ID", async () => {
            // Mock Call.findOne
            (Call.findOne as jest.Mock).mockResolvedValue({
                roomId: "12345",
            });

            const response = await request(app)
                .post("/calls/token")
                .set("Authorization", "Bearer valid_token")
                .send({
                    roomId: "12345",
                    role: "host",
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "success",
                message: "Token generated successfully",
                data: {
                    token: expect.any(String),
                    roomId: "12345",
                    role: "host",
                    expiresIn: 3600,
                },
            });
        });

        it("should return 404 if the room ID is invalid", async () => {
            (Call.findOne as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/calls/token")
                .set("Authorization", "Bearer valid_token")
                .send({
                    roomId: "invalid-room",
                    role: "host",
                });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                status: "error",
                message: "Call with room ID invalid-room not found",
            });
        });
    });
});
