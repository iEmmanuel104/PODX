/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: StreamIO webhook endpoints
 */

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Process StreamIO webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The type of webhook event
 *                 example: "call.session_participant_joined"
 *               event:
 *                 type: object
 *                 description: The event payload
 *                 example: {
 *                   "call": {
 *                     "id": "call-123456789abcdef",
 *                     "type": "video",
 *                     "created_by": {
 *                       "id": "6442a55d8d99b93c05c0feac",
 *                       "name": "crypto_enthusiast"
 *                     }
 *                   },
 *                   "session_id": "session-123456789abcdef",
 *                   "participant": {
 *                     "user": {
 *                       "id": "6442a55d8d99b93c05c0feac",
 *                       "name": "crypto_enthusiast"
 *                     },
 *                     "role": "host",
 *                     "joined_at": "2023-06-15T14:30:00.000Z"
 *                   },
 *                   "created_at": "2023-06-15T14:30:00.000Z"
 *                 }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid webhook payload"
 */ 