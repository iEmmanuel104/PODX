import express, { Router } from 'express';
import WebhookController from '../controllers/webhook.controller';

const router: Router = express.Router();

// Huddle01 webhook
router.post('/huddle01', WebhookController.handleHuddle01Webhook);

export default router;

