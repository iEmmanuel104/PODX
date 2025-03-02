import express, { Router } from 'express';
import WebhookController from '../controllers/webhook.controller';


const router: Router = express.Router();

router
    .post('/', WebhookController.handleStreamWebhook);

export default router;

