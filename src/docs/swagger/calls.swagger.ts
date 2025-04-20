/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Video call management endpoints using Huddle01 integration
 */

/**
 * @swagger
 * tags:
 *   name: Huddle01
 *   description: Endpoints for direct Huddle01 API integration
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Call:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - type
 *         - status
 *         - hostWalletAddress
 *         - createdById
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the call, same as the Huddle01 roomId
 *           example: "abc-def-ghi"
 *         title:
 *           type: string
 *           description: Title of the call
 *           example: "Team Meeting"
 *         description:
 *           type: string
 *           description: Detailed description of the call
 *           example: "Weekly team sync meeting"
 *         type:
 *           type: string
 *           enum: [audio, video]
 *           description: Type of call
 *           example: "video"
 *         status:
 *           type: string
 *           enum: [created, live, ended]
 *           description: Current status of the call
 *           example: "created"
 *         hostWalletAddress:
 *           type: string
 *           description: Wallet address of the call host
 *           example: "0x123456789abcdef..."
 *         createdById:
 *           type: string
 *           description: User ID of who created the call
 *           example: "507f1f77bcf86cd799439012"
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the call started
 *           example: "2024-04-10T15:00:00Z"
 *         endedAt:
 *           type: string
 *           format: date-time
 *           description: When the call ended (if applicable)
 *           example: "2024-04-10T16:00:00Z"
 *         duration:
 *           type: number
 *           description: Duration of the call in seconds (if ended)
 *           example: 3600
 *         members:
 *           type: array
 *           description: List of call participants
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               role:
 *                 type: string
 *                 enum: [host, guest]
 *                 example: "guest"
 *         tokenGating:
 *           type: object
 *           description: Token gating configuration (if enabled)
 *           properties:
 *             enabled:
 *               type: boolean
 *               example: true
 *             type:
 *               type: string
 *               enum: [external]
 *               example: "external"
 *             addresses:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["0x123..."]
 *         isActive:
 *           type: boolean
 *           description: Whether the call is currently active
 *           example: true
 *         isPrivate:
 *           type: boolean
 *           description: Whether this is a private call
 *           example: false
 *         isScheduled:
 *           type: boolean
 *           description: Whether this is a scheduled call
 *           example: false
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: When the call is scheduled to start (if isScheduled is true)
 *           example: "2024-04-10T15:00:00Z"
 *
 *     Huddle01Room:
 *       type: object
 *       required:
 *         - roomId
 *         - hostWalletAddress
 *       properties:
 *         roomId:
 *           type: string
 *           description: Unique Huddle01 room identifier
 *           example: "abc-def-ghi"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time when the room was created
 *           example: "2023-07-20T14:30:00Z"
 *         roomLocked:
 *           type: boolean
 *           description: Whether the room is locked
 *           example: true
 *         meetingUrl:
 *           type: string
 *           description: URL to access the meeting
 *           example: "https://app.huddle01.com/abc-def-ghi"
 *         hostWalletAddress:
 *           type: string
 *           description: Wallet address of the host
 *           example: "0x123abc..."
 *         tokenGating:
 *           type: object
 *           description: Token gating configuration
 *           properties:
 *             enabled:
 *               type: boolean
 *               example: true
 *             type:
 *               type: string
 *               enum: [external]
 *               example: "external"
 *             addresses:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["0x123..."]
 *
 *     Huddle01AccessToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token for accessing a Huddle01 room
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         expiresIn:
 *           type: number
 *           description: Token expiration time in seconds
 *           example: 3600
 *
 *     Huddle01RoomDetails:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *           description: Unique Huddle01 room identifier
 *           example: "abc-def-ghi"
 *         status:
 *           type: string
 *           enum: [active, inactive, ended]
 *           description: Current status of the room
 *           example: "active"
 *         activeParticipants:
 *           type: array
 *           description: List of active participants in the room
 *           items:
 *             type: object
 *             properties:
 *               peerId:
 *                 type: string
 *                 example: "peer-123"
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *               avatarUrl:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *               joinedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-07-20T14:35:00Z"
 *         recording:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [active, inactive, completed]
 *               example: "inactive"
 *             startedAt:
 *               type: string
 *               format: date-time
 *               example: null
 *             url:
 *               type: string
 *               example: null
 */

/**
 * @swagger
 * /calls/create:
 *   post:
 *     summary: Create a new call
 *     description: |
 *       Creates a new Huddle01 room with optional token gating, image, and scheduling.
 *       Integrates with Huddle01's createRoom() API to generate a unique roomId.
 *       The room starts locked (roomLocked: true) and includes custom metadata.
 *       If `isScheduled` is true, `scheduledTime` must be provided and be in the future.
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the call
 *                 example: "Team Meeting"
 *               type:
 *                 type: string
 *                 enum: [audio, video]
 *                 description: Type of call
 *                 example: "video"
 *               description:
 *                 type: string
 *                 description: Optional detailed description of the call
 *                 example: "Weekly team sync meeting"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional thumbnail image for the call
 *               tokenGatingAddresses:
 *                 type: array
 *                 description: List of wallet addresses for token gating
 *                 items:
 *                   type: string
 *                 example: ["0x123..."]
 *               tokenGatingType:
 *                 type: string
 *                 enum: [external]
 *                 description: Type of token gating
 *                 example: "external"
 *               durationRequirement:
 *                 type: number
 *                 description: Percentage duration requirement for participants
 *                 example: 70
 *               isScheduled:
 *                 type: boolean
 *                 description: Whether this is a scheduled call
 *                 default: false
 *                 example: false
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the call is scheduled to start (required and must be in the future if isScheduled is true)
 *                 example: "2025-04-10T15:00:00Z"
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
 *                     roomId:
 *                       type: string
 *                       example: "xof-tzgw-ycv"
 *                     title:
 *                       type: string
 *                       example: "Team Meeting"
 *                     description:
 *                       type: string
 *                       example: "Weekly team sync meeting"
 *                     type:
 *                       type: string
 *                       example: "video"
 *                     host:
 *                       type: object
 *                       properties:
 *                         walletAddress:
 *                           type: string
 *                           example: "0x4c4f1968359425eb6457dd89e88eda18fbc39c45"
 *                         username:
 *                           type: string
 *                           example: "guest-0x4c4f19"
 *                     status:
 *                       type: string
 *                       example: "created"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isPrivate:
 *                       type: boolean
 *                       example: true
 *                     tokenGating:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         type:
 *                           type: string
 *                           example: "external"
 *                         allowedWallets:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["0x123..."]
 *                     resources:
 *                       type: object
 *                       properties:
 *                         ipfs:
 *                           type: string
 *                           example: "ipfs://bafkreiazrxg7mfuzi5t2vpgbob76jkrbexfoyud276hlpouvrbbc2bwy7y"
 *                     durationRequirement:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 70
 *                         type:
 *                           type: string
 *                           example: "percentage"
 *                     isScheduled:
 *                       type: boolean
 *                       description: Indicates if the call is scheduled
 *                       example: false
 *                     scheduledTime:
 *                       type: string
 *                       format: date-time
 *                       description: The scheduled start time (only present if isScheduled is true)
 *                       example: "2025-04-10T15:00:00Z"
 *                     timestamps:
 *                       type: object
 *                       properties:
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-04-04T11:41:34.658Z"
 *       400:
 *         description: Invalid input (e.g., missing scheduledTime when isScheduled is true, scheduledTime in the past)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /calls/info/{sessionId}:
 *   get:
 *     summary: Get call information by session ID
 *     description: |
 *       Retrieves detailed information about a specific call by its session ID.
 *       Returns call metadata, member information, status, and scheduling details.
 *       The `scheduledTime` field is only included if `isScheduled` is true.
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID of the call (same as roomId)
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
 *                   example: "Call details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                       example: "xof-tzgw-ycv"
 *                     title:
 *                       type: string
 *                       example: "Team Meeting"
 *                     description:
 *                       type: string
 *                       example: "Weekly team sync meeting"
 *                     type:
 *                       type: string
 *                       enum: [audio, video]
 *                       example: "video"
 *                     host:
 *                       type: object
 *                       properties:
 *                         walletAddress:
 *                           type: string
 *                           example: "0x4c4f1968359425eb6457dd89e88eda18fbc39c45"
 *                         username:
 *                           type: string
 *                           example: "guest-0x4c4f19"
 *                     status:
 *                       type: string
 *                       enum: [created, live, ended]
 *                       example: "created"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isPrivate:
 *                       type: boolean
 *                       example: false
 *                     tokenGating:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         type:
 *                           type: string
 *                           example: "external"
 *                         allowedWallets:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["0x123..."]
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           peerId:
 *                             type: string
 *                             example: "peerId--AmxuhmUBW17kP1FGL2mU"
 *                           joinTime:
 *                             type: number
 *                             description: Time of joining in epoch timestamp format
 *                             example: 1706810039986
 *                           exitTime:
 *                             type: number
 *                             description: Time of exiting in epoch timestamp format (if applicable)
 *                             example: 1706811249372
 *                           metadata:
 *                             type: object
 *                             description: Custom metadata associated with the peer
 *                     resources:
 *                       type: object
 *                       properties:
 *                         ipfs:
 *                           type: string
 *                           example: "ipfs://bafkreiazrxg7mfuzi5t2vpgbob76jkrbexfoyud276hlpouvrbbc2bwy7y"
 *                     isScheduled:
 *                       type: boolean
 *                       description: Indicates if the call is scheduled
 *                       example: false
 *                     scheduledTime:
 *                       type: string
 *                       format: date-time
 *                       description: The scheduled start time (only present if isScheduled is true)
 *                       example: "2025-04-10T15:00:00Z"
 *                     timestamps:
 *                       type: object
 *                       properties:
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-04-04T11:41:34.658Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call not found
 */

/**
 * @swagger
 * /calls/stats:
 *   get:
 *     summary: Get call statistics
 *     description: |
 *       Get aggregated statistics about all calls.
 *       Uses Huddle01's getMetrics() API to retrieve global metrics about:
 *       - Total number of sessions
 *       - Total duration of all sessions
 *       - Recording and livestream counts
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
 *                   example: "Call stats"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSessions:
 *                       type: number
 *                       example: 156
 *                     totalDuration:
 *                       type: number
 *                       description: Total duration in minutes across all sessions
 *                       example: 10254
 *                     recordingCount:
 *                       type: number
 *                       example: 7
 *                     livestreamCount:
 *                       type: number
 *                       example: 2
 */

/**
 * @swagger
 * /calls/{roomId}/live-participants:
 *   get:
 *     summary: Get live participants in a room
 *     description: |
 *       Get a list of participants currently active in a specific room.
 *       Uses Huddle01's getLiveParticipantsDetails() API to retrieve real-time data about:
 *       - Who is currently in the room (peerId)
 *       - When they joined (joinTime)
 *       - Their metadata
 *       This provides real-time information directly from Huddle01 servers.
 *     tags: [Calls]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Huddle01 room ID to query
 *     responses:
 *       200:
 *         description: Live participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           peerId:
 *                             type: string
 *                             example: "peerId--AmxuhmUBW17kP1FGL2mU"
 *                           joinTime:
 *                             type: number
 *                             description: Time of joining in epoch timestamp format
 *                             example: 1706810039986
 *                           exitTime:
 *                             type: number
 *                             description: Time of exiting in epoch timestamp format (if applicable)
 *                             example: 1706811249372
 *                           metadata:
 *                             type: object
 *                             description: Custom metadata associated with the peer
 */

/**
 * @swagger
 * /huddle01/token/{roomId}:
 *   get:
 *     summary: Generate an access token for a Huddle01 room
 *     description: |
 *       Generates a JWT access token for a specific Huddle01 room.
 *       This token is required for users to join a room.
 *       Calls Huddle01's getAccessToken() API method with your API key.
 *       The token includes user-specific claims and room access permissions.
 *     tags: [Huddle01]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Huddle01 room ID
 *     responses:
 *       200:
 *         description: Access token generated successfully
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
 *                   example: "Access token generated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Huddle01AccessToken'
 *       400:
 *         description: Invalid roomId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error or Huddle01 API error
 */

/**
 * @swagger
 * /calls/token:
 *   post:
 *     summary: Generate a token for joining a call
 *     description: |
 *       Generates a JWT access token for joining a Huddle01 room with specific permissions.
 *       This token includes user information as metadata and assigns appropriate
 *       permissions based on the requested role. The token is required for users
 *       to join a call with the Huddle01 client SDK.
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
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: The room ID of the call to join
 *                 example: "abc-def-ghi"
 *               role:
 *                 type: string
 *                 enum: [host, coHost, guest, speaker, listener, bot]
 *                 description: The role to assign in the call
 *                 default: "guest"
 *                 example: "guest"
 *               permissions:
 *                 type: object
 *                 description: Custom permissions (optional, defaults based on role if not provided)
 *                 properties:
 *                   admin:
 *                     type: boolean
 *                     example: false
 *                   canConsume:
 *                     type: boolean
 *                     example: true
 *                   canProduce:
 *                     type: boolean
 *                     example: true
 *                   canProduceSources:
 *                     type: object
 *                     properties:
 *                       cam:
 *                         type: boolean
 *                         example: true
 *                       mic:
 *                         type: boolean
 *                         example: true
 *                       screen:
 *                         type: boolean
 *                         example: true
 *                   canRecvData:
 *                     type: boolean
 *                     example: true
 *                   canSendData:
 *                     type: boolean
 *                     example: true
 *                   canUpdateMetadata:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       200:
 *         description: Token generated successfully
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
 *                   example: "Token generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlJZCI6IkVrcWFwb0RWaXNWRFJ3WmZMa2FXIiwicm9vbUlkIjoibWV0LXdxaW4tcnZ0IiwicGVlcklkIjoicGVlcklkLS1YV1ltR3YzMU9mZWpZVzRTaW1PMCIsInJvbGUiOiJIT1NUIiwicGVybWlzc2lvbnMiOnsiYWRtaW4iOnRydWUsImNhbkNvbnN1bWUiOnRydWUsImNhblByb2R1Y2UiOnRydWUsImNhblByb2R1Y2VTb3VyY2VzIjp7ImNhbSI6dHJ1ZSwibWljIjp0cnVlLCJzY3JlZW4iOnRydWV9LCJjYW5SZWxheT90cnVlLCJjYW5VcGRhdGVNZXRhZGF0YSI6dHJ1ZSwiY2FuUmVjdkRhdGEiOnRydWUsImNhblNlbmREYXRhIjp0cnVlfSwibWV0YWRhdGEiOnsid2FsbGV0QWRkcmVzcyI6IjB4NDVhZGJkZjYyZGFmZDAzYmYwYzFlYzVlYmNiNTVkODBmMzU2ZjQ1OCIsInVzZXJJZCI6IjY1MzcwMjA5ZWVkMzYxNWYxZDcyZjM5MyIsInVzZXJuYW1lIjoiZ3Vlc3QtMHg0NWFkYmQiLCJkaXNwbGF5TmFtZSI6Imd1ZXN0LTB4NDVhZGJkIn0sImlhdCI6MTcxNTI2MjAwOX0.wNuRd4L9gg3fpnL4BVp2XWGnmC8N9QIrSqv0EYx0XRk"
 *                     roomId:
 *                       type: string
 *                       example: "abc-def-ghi"
 *                     role:
 *                       type: string
 *                       example: "guest"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         walletAddress:
 *                           type: string
 *                           example: "0x45adbdf62dafd03bf0c1ec5ebcb55d80f356f458"
 *                         userId:
 *                           type: string
 *                           example: "6537020"
 *                         username:
 *                           type: string
 *                           example: "guest-0x45adbd"
 *                         displayName:
 *                           type: string
 *                           example: "guest-0x45adbd"
 *                     expiresIn:
 *                       type: number
 *                       example: 3600
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */