import express, { Router } from "express";
import WebhookController from "../controllers/webhook.controller";

const router: Router = express.Router();

// Huddle01 webhook
router.post("/huddle01", (req, res) =>
    WebhookController.handleHuddle01Webhook(req, res),
);

export default router;
