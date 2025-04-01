/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Stream.io webhook handling endpoints
 */

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Handle Stream.io webhooks
 *     description: Processes webhooks from Stream.io for call events like creation, joining, leaving, and ending
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - created_at
 *               - payload
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of webhook event
 *                 example: "call.created"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: When the event occurred
 *                 example: "2024-03-20T10:30:00.000Z"
 *               payload:
 *                 type: object
 *                 description: Event-specific payload data
 *                 properties:
 *                   call:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       type:
 *                         type: string
 *                         example: "default"
 *                       created_by:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user123"
 *                   session_id:
 *                     type: string
 *                     example: "session123"
 *                   participant:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "user123"
 *                       joined_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-20T10:30:00.000Z"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Invalid webhook payload
 *       401:
 *         description: Unauthorized - Invalid webhook signature
 *       500:
 *         description: Internal server error while processing webhook
 */ 