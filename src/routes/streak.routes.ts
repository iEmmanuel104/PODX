import express, { Router } from "express";
import { StreakController } from "../controllers/streak.controller";
import { basicAuth } from "../middlewares/authMiddleware";
import {
    AsyncToSyncController,
    AuthAsyncToSyncController,
} from "../middlewares/utils";

const router: Router = express.Router();

router
    .get(
        "/leaderboard",
        AsyncToSyncController((req, res) =>
            StreakController.getLeaderboard(req, res),
        ),
    )
    .post(
        "/sync-user",
        basicAuth(),
        AuthAsyncToSyncController((req, res) =>
            StreakController.recalculateUserStreak(req, res),
        ),
    )
    .post(
        "/sync-local",
        AsyncToSyncController((req, res) =>
            StreakController.recalculateAllStreaks(req, res),
        ),
    );

export default router;
