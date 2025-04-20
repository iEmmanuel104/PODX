/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook endpoints for integrations with external services like Huddle01
 */

/**
 * @swagger
 * /webhooks/huddle01:
 *   post:
 *     summary: Process Huddle01 webhooks
 *     description: |
 *       Endpoint for receiving webhook events from Huddle01.
 *       Processes various events such as meeting started/ended, peer joined/left, and recording events.
 *       The webhook signature is verified using the Huddle01-Signature header.
 *     tags: [Webhooks]
 *     parameters:
 *       - in: header
 *         name: Huddle01-Signature
 *         description: Webhook signature for verification
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the webhook event
 *                 example: "whk_123456789abcdef"
 *               type:
 *                 type: string
 *                 description: The type of webhook event
 *                 enum: [meeting:started, meeting:ended, peer:joined, peer:left, recording:started, recording:stopped, recording:updated]
 *                 example: "meeting:started"
 *               payload:
 *                 type: object
 *                 description: Event-specific data payload
 *                 oneOf:
 *                   - $ref: '#/components/schemas/MeetingStarted'
 *                   - $ref: '#/components/schemas/MeetingEnded'
 *                   - $ref: '#/components/schemas/PeerJoined'
 *                   - $ref: '#/components/schemas/PeerLeft'
 *                   - $ref: '#/components/schemas/Recording'
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
 *                   example: "Huddle01 webhook processed successfully"
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
 *                   example: "Invalid webhook payload or missing required fields"
 *       401:
 *         description: Invalid signature
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
 *                   example: "Invalid webhook signature"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MeetingStarted:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: The ID of the Huddle01 room
 *           example: "abc-def-ghi"
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the meeting started
 *           example: "2023-07-20T14:30:00Z"
 *         host:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *               description: Wallet address of the host
 *               example: "0x123abc..."
 *             displayName:
 *               type: string
 *               description: Display name of the host
 *               example: "John Doe"
 *
 *     MeetingEnded:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: The ID of the Huddle01 room
 *           example: "abc-def-ghi"
 *         endedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the meeting ended
 *           example: "2023-07-20T15:30:00Z"
 *         duration:
 *           type: number
 *           description: Duration of the meeting in seconds
 *           example: 3600
 *
 *     PeerJoined:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: The ID of the Huddle01 room
 *           example: "abc-def-ghi"
 *         peerId:
 *           type: string
 *           description: The ID of the peer who joined
 *           example: "peer-123"
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the peer joined
 *           example: "2023-07-20T14:35:00Z"
 *         peerData:
 *           type: object
 *           properties:
 *             displayName:
 *               type: string
 *               description: Display name of the peer
 *               example: "Jane Smith"
 *             avatarUrl:
 *               type: string
 *               description: Avatar URL of the peer
 *               example: "https://example.com/avatar.jpg"
 *             walletAddress:
 *               type: string
 *               description: Wallet address of the peer (if available)
 *               example: "0x456def..."
 *
 *     PeerLeft:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: The ID of the Huddle01 room
 *           example: "abc-def-ghi"
 *         peerId:
 *           type: string
 *           description: The ID of the peer who left
 *           example: "peer-123"
 *         leftAt:
 *           type: string
 *           format: date-time
 *           description: The time when the peer left
 *           example: "2023-07-20T15:15:00Z"
 *         duration:
 *           type: number
 *           description: Duration of the peer's participation in seconds
 *           example: 2400
 *
 *     Recording:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: The ID of the Huddle01 room
 *           example: "abc-def-ghi"
 *         recordingId:
 *           type: string
 *           description: The ID of the recording
 *           example: "rec-123"
 *         status:
 *           type: string
 *           enum: [started, stopped, updated, processed]
 *           description: Status of the recording
 *           example: "processed"
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the recording started
 *           example: "2023-07-20T14:40:00Z"
 *         stoppedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the recording stopped (if applicable)
 *           example: "2023-07-20T15:20:00Z"
 *         url:
 *           type: string
 *           description: URL of the processed recording (if available)
 *           example: "https://api.huddle01.com/recordings/rec-123.mp4"
 */ 