/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { CallService } from "../services/call.service";
// import {
//     verifyWebhookSignature,
//     isRelevantEvent,
// } from "../clients/webhook.config";
// import Huddle01Config from "../clients/huddle01.config";
import { BadRequestError } from "../utils/customErrors";
import { logger } from "../utils/logger";

function isRelevantEvent(eventType: string): boolean {
    logger.info(`Checking if event type ${eventType} is relevant: Irrelevant`);
    return false;
}
export default class WebhookController {
    static handleStreamWebhook(req: Request, res: Response): void {
        try {
            const signature = req.headers["x-signature"] as string;
            const webhookId = req.headers["x-webhook-id"] as string;

            // Verify webhook signature
            if (
                !signature // ||
                // ! Find -> !verifyWebhookSignature(signature, JSON.stringify(req.body))
            ) {
                throw new BadRequestError("Invalid webhook signature");
            }

            // Process the webhook event
            const { type, ...payload } = req.body;

            // Verify if this is a relevant event type
            if (!isRelevantEvent(type)) {
                logger.info(`Skipping non-relevant event type: ${type}`);
                res.status(200).json({
                    status: "success",
                    message: "Event type not processed",
                    webhookId,
                });
                return;
            }

            // Log webhook receipt
            logger.info(`Received webhook ${webhookId} of type ${type}`);

            // Process webhook asynchronously
            CallService.processWebhook(type, payload).catch((error) => {
                logger.error(`Error processing webhook ${webhookId}:`, error);
            });

            // Return immediate success response
            res.status(200).json({
                status: "success",
                message: "Webhook received",
                webhookId,
            });
        } catch (error) {
            logger.error("Webhook processing error:", error);
            if (error instanceof BadRequestError) {
                res.status(400).json({
                    status: "error",
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    status: "error",
                    message: "Internal server error processing webhook",
                });
            }
        }
    }

    static handleHuddle01Webhook(req: Request, res: Response): void {
        try {
            // Get Huddle01 signature header
            const signature = req.headers["huddle01-signature"] as string;

            if (!signature) {
                throw new BadRequestError("Missing Huddle01 signature header");
            }

            // Verify webhook data
            const { data, error } = {} as any;
            // ! Find!!
            // Huddle01Config.verifyWebhook(
            //     req.body,
            //     signature,
            // );

            if (error || !data) {
                throw new BadRequestError("Invalid webhook signature");
            }

            // Process webhook event based on type
            const { type } = data;

            logger.info(`Received Huddle01 webhook of type ${type}`);

            // Process webhook asynchronously
            CallService.processHuddle01Webhook(type, data.payload).catch(
                (err) => {
                    logger.error("Error processing Huddle01 webhook:", err);
                },
            );

            // Return immediate success response
            res.status(200).json({
                status: "success",
                message: "Webhook received and processing",
            });
        } catch (error) {
            logger.error("Webhook processing error:", error);

            if (error instanceof BadRequestError) {
                res.status(400).json({
                    status: "error",
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    status: "error",
                    message: "Internal server error processing webhook",
                });
            }
        }
    }
}
