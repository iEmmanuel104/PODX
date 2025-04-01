/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Video call management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Call:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6442a55d8d99b93c05c0feac"
 *         callId:
 *           type: string
 *           example: "call-123"
 *         type:
 *           type: string
 *           example: "default"
 *         status:
 *           type: string
 *           enum: [scheduled, live, ended]
 *           example: "live"
 *         createdById:
 *           type: string
 *           example: "user123"
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: number
 *           example: 3600
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               joinTime:
 *                 type: string
 *                 format: date-time
 *               leaveTime:
 *                 type: string
 *                 format: date-time
 *     DurationRequirement:
 *       type: object
 *       properties:
 *         value:
 *           type: number
 *           description: The duration value. For absolute type, this is in seconds. For percentage type, this is a percentage (0-100).
 *           example: 60
 *         type:
 *           type: string
 *           enum: [absolute, percentage]
 *           description: Whether the value represents absolute seconds or a percentage of the scheduled duration
 *           example: absolute
 *       required:
 *         - value
 *         - type
 */

/**
 * @swagger
 * /calls/schedule:
 *   post:
 *     summary: Schedule a new call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the call
 *               type:
 *                 type: string
 *                 description: Type of call
 *               starts_at:
 *                 type: string
 *                 format: date-time
 *                 description: When the call starts
 *               scheduledDuration:
 *                 type: number
 *                 description: Scheduled duration in minutes
 *                 default: 60
 *               durationRequirement:
 *                 $ref: '#/components/schemas/DurationRequirement'
 *                 description: Duration requirements for the call. If not provided, defaults to 1 second absolute.
 *     responses:
 *       200:
 *         description: Call scheduled successfully
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
 *                   example: "Call scheduled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/scheduled:
 *   get:
 *     summary: Get user's scheduled calls
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled calls retrieved successfully
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
 *                   example: "Scheduled calls retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/info/{sessionId}:
 *   get:
 *     summary: Get call information by session ID
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID of the call
 *     responses:
 *       200:
 *         description: Call information retrieved successfully
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
 *                   example: "Call information retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Call'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call not found
 */

/**
 * @swagger
 * /calls/scheduled/{sessionId}:
 *   delete:
 *     summary: Delete a scheduled call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID of the scheduled call
 *     responses:
 *       200:
 *         description: Call deleted successfully
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
 *                   example: "Call deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call not found
 */

/**
 * @swagger
 * /calls/create:
 *   post:
 *     summary: Create a new call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the call
 *               type:
 *                 type: string
 *                 description: Type of call
 *               durationRequirement:
 *                 $ref: '#/components/schemas/DurationRequirement'
 *                 description: Duration requirements for the call. If not provided, defaults to 1 second absolute.
 *     responses:
 *       201:
 *         description: Call created successfully
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
 *                   example: "Call created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     callId:
 *                       type: string
 *                       example: "call-123"
 *                       description: Unique identifier for the created call
 *       400:
 *         description: Invalid input - missing required fields or invalid duration requirement values
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 */

/**
 * @swagger
 * /calls/get-or-create:
 *   post:
 *     summary: Get existing call or create new one
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               callType:
 *                 type: string
 *                 description: Type of call
 *               callId:
 *                 type: string
 *                 description: Unique identifier for the call
 *               durationRequirement:
 *                 $ref: '#/components/schemas/DurationRequirement'
 *                 description: Duration requirements for the call. If not provided, defaults to 1 second absolute.
 *     responses:
 *       200:
 *         description: Call retrieved or created successfully
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
 *                   example: "Call retrieved or created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/settings:
 *   patch:
 *     summary: Update call settings
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callType
 *               - callId
 *               - settings
 *             properties:
 *               callType:
 *                 type: string
 *                 example: "default"
 *               callId:
 *                 type: string
 *                 example: "call-123"
 *               settings:
 *                 type: object
 *                 properties:
 *                   audio:
 *                     type: object
 *                     properties:
 *                       mic_default_on:
 *                         type: boolean
 *                         example: true
 *                       default_device:
 *                         type: string
 *                         enum: [speaker, earpiece]
 *                         example: "speaker"
 *                       access_request_enabled:
 *                         type: boolean
 *                         example: false
 *                       opus_dtx_enabled:
 *                         type: boolean
 *                         example: false
 *                       redundant_coding_enabled:
 *                         type: boolean
 *                         example: false
 *                       speaker_default_on:
 *                         type: boolean
 *                         example: false
 *                   video:
 *                     type: object
 *                     properties:
 *                       camera_default_on:
 *                         type: boolean
 *                         example: true
 *                       access_request_enabled:
 *                         type: boolean
 *                         example: false
 *                       camera_facing:
 *                         type: string
 *                         enum: [front, back]
 *                         example: "front"
 *                       enabled:
 *                         type: boolean
 *                         example: true
 *                       target_resolution:
 *                         type: object
 *                         properties:
 *                           width:
 *                             type: number
 *                             example: 640
 *                           height:
 *                             type: number
 *                             example: 480
 *                           bitrate:
 *                             type: number
 *                             example: 512
 *                   backstage:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         example: false
 *                   recording:
 *                     type: object
 *                     properties:
 *                       mode:
 *                         type: string
 *                         enum: [available, disabled, auto-on]
 *                         example: "available"
 *                       quality:
 *                         type: string
 *                         enum: [360p, 480p, 720p, 1080p, 1440p, portrait-360x640, portrait-480x854, portrait-720x1280, portrait-1080x1920, portrait-1440x2560]
 *                         example: "720p"
 *     responses:
 *       200:
 *         description: Call settings updated successfully
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
 *                   example: "Call settings updated successfully"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/members:
 *   patch:
 *     summary: Update call members
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callType
 *               - callId
 *             properties:
 *               callType:
 *                 type: string
 *                 example: "default"
 *               callId:
 *                 type: string
 *                 example: "call-123"
 *               updateMembers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "user123"
 *                     role:
 *                       type: string
 *                       example: "host"
 *               removeMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user456"]
 *     responses:
 *       200:
 *         description: Call members updated successfully
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
 *                   example: "Call members updated successfully"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/end:
 *   post:
 *     summary: End a call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callType
 *               - callId
 *             properties:
 *               callType:
 *                 type: string
 *                 example: "default"
 *               callId:
 *                 type: string
 *                 example: "call-123"
 *     responses:
 *       200:
 *         description: Call ended successfully
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
 *                   example: "Call ended successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calls/stats:
 *   get:
 *     summary: Get call statistics
 *     tags: [Calls]
 *     responses:
 *       200:
 *         description: Call statistics retrieved successfully
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
 *                   example: "Call statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCalls:
 *                       type: number
 *                       example: 1500
 *                     ongoingCalls:
 *                       type: number
 *                       example: 25
 *                     completedCalls:
 *                       type: number
 *                       example: 1450
 *                     upcomingCalls:
 *                       type: number
 *                       example: 25
 *                     callsByType:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: {"default": 1200, "webinar": 300}
 *                     callsByDate:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: {"2024-03-20": 50, "2024-03-19": 45}
 */

/**
 * @swagger
 * /calls/detailed-stats:
 *   get:
 *     summary: Get detailed call statistics
 *     tags: [Calls]
 *     responses:
 *       200:
 *         description: Detailed call statistics retrieved successfully
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
 *                   example: "Detailed call statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-03-20"
 *                           totalCalls:
 *                             type: number
 *                             example: 150
 *                           totalDuration:
 *                             type: number
 *                             example: 36000
 *                           uniqueUsers:
 *                             type: number
 *                             example: 75
 */

/**
 * @swagger
 * /calls/members:
 *   post:
 *     summary: Query call members
 *     tags: [Calls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callId
 *             properties:
 *               callId:
 *                 type: string
 *                 example: "call-123"
 *               filter:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [active, left]
 *                     example: "active"
 *     responses:
 *       200:
 *         description: Call members retrieved successfully
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
 *                   example: "Call members retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "user123"
 *                       joinTime:
 *                         type: string
 *                         format: date-time
 *                       leaveTime:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid input
 */ 