import express, { Router } from "express";
import Huddle01Controller from "../controllers/huddle01.controller";
import { basicAuth } from "../middlewares/auth.middleware";
import { AuthenticatedRequest } from "../middlewares/types";

const router: Router = express.Router();

// Token generation for joining rooms
router.get("/token/:roomId", basicAuth(), (req, res) =>
    Huddle01Controller.generateAccessToken(req as AuthenticatedRequest, res),
);

export default router;
