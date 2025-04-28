import express, { Router } from "express";
import Huddle01Controller from "../controllers/huddle01.controller";
import { basicAuth } from "../middlewares/authMiddleware";
import { AuthAsyncToSyncController } from "../middlewares/utils";

const router: Router = express.Router();

// Token generation for joining rooms
router.get(
    "/token/:roomId",
    basicAuth(),
    AuthAsyncToSyncController((req, res) =>
        Huddle01Controller.generateAccessToken(req, res),
    ),
);

export default router;
