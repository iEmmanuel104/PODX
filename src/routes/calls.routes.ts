/**
 * Routes for managing video calls using Huddle01 API integration
 * Provides endpoints for creating, retrieving, and managing call sessions
 */
import express, { Router } from "express";

import CallsController from "../controllers/calls.controller";
import { basicAuth } from "../middlewares/authMiddleware";
import { UploadImageFiles } from "../middlewares/storage.middleware";
import {
    AsyncToSyncController,
    AuthAsyncToSyncController,
} from "../middlewares/utils";
import { validationMiddleware } from "../middlewares/validators.middleware";
import { CreateCallDto } from "../controllers/dto/createCall.dto";
// import { GenerateTokenDto } from "../controllers/dto/generateToken.dto";

const router: Router = express.Router();

// Create a new call room
router.post(
    "/create",
    basicAuth(),
    validationMiddleware(CreateCallDto),
    UploadImageFiles.single("image"),
    AuthAsyncToSyncController((req, res) =>
        CallsController.createCall(req, res),
    ),
);

// Get call information by session ID
router.get(
    "/info/:sessionId",
    basicAuth(),
    AuthAsyncToSyncController((req, res) => CallsController.getCall(req, res)),
);

// Get call statistics
router.get(
    "/stats",
    AsyncToSyncController((req, res) => CallsController.getCallStats(req, res)),
);

// Get live participants in a meeting
router.get(
    "/:roomId/live-participants",
    AsyncToSyncController((req, res) =>
        CallsController.getLiveParticipants(req, res),
    ),
);

// Generate access token for a call
router.post(
    "/token",
    basicAuth(),
    // validationMiddleware(GenerateTokenDto),
    AuthAsyncToSyncController((req, res) =>
        CallsController.generateToken(req, res),
    ),
);

export default router;
