import express, { Router } from "express";
import UserController from "../controllers/user.controller";
import { basicAuth } from "../middlewares/authMiddleware";
import {
    AsyncToSyncController,
    AuthAsyncToSyncController,
} from "../middlewares/utils";

const router: Router = express.Router();

router
    .get(
        "/",
        basicAuth(),
        AuthAsyncToSyncController((req, res) =>
            UserController.getAllUsers(req, res),
        ),
    )
    .post(
        "/validate",
        AsyncToSyncController((req, res) =>
            UserController.validateUser(req, res),
        ),
    )
    .patch(
        "/update",
        basicAuth(),
        AuthAsyncToSyncController((req, res) =>
            UserController.updateUser(req, res),
        ),
    );

export default router;
