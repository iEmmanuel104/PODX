import { Request, Response } from 'express';
import { CallService } from '../services/call.service';
import { verifyWebhookSignature, isRelevantEvent } from '../clients/webhook.config';
import { BadRequestError } from '../utils/customErrors';

export default class WebhookController {
    static async handleStreamWebhook(req: Request, res: Response): Promise<void> {
        try {
            const signature = req.headers['x-signature'] as string;
            const webhookId = req.headers['x-webhook-id'] as string;

            // Verify webhook signature
            if (!signature || !verifyWebhookSignature(signature, JSON.stringify(req.body))) {
                throw new BadRequestError('Invalid webhook signature');
            }

            // Process the webhook event
            const { type, ...payload } = req.body;

            // Verify if this is a relevant event type
            if (!isRelevantEvent(type)) {
                console.log(`Skipping non-relevant event type: ${type}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Event type not processed',
                    webhookId,
                });
                return;
            }

            // Log webhook receipt
            console.log(`Received webhook ${webhookId} of type ${type}`);

            // Process webhook asynchronously
            CallService.processWebhook(type, payload)
                .catch(error => {
                    console.error(`Error processing webhook ${webhookId}:`, error);
                });

            // Return immediate success response
            res.status(200).json({
                status: 'success',
                message: 'Webhook received',
                webhookId,
            });

        } catch (error) {
            console.error('Webhook processing error:', error);
            if (error instanceof BadRequestError) {
                res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Internal server error processing webhook',
                });
            }
        }
    }
}