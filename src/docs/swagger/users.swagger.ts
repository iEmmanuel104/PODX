/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6442a55d8d99b93c05c0feac"
 *         username:
 *           type: string
 *           example: "user123"
 *         walletAddress:
 *           type: string
 *           example: "0x4C4F1968359425Eb6457Dd89E88EDA18fBC39C45"
 *         displayImage:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/info:
 *   get:
 *     summary: Get current user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                   example: "User information retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/streak-stats:
 *   get:
 *     summary: Get user's streak statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User streak stats retrieved successfully
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
 *                   example: "User streak stats retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentStreak:
 *                       type: number
 *                       example: 5
 *                     longestStreak:
 *                       type: number
 *                       example: 10
 *                     totalPoints:
 *                       type: number
 *                       example: 1500
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/validate:
 *   post:
 *     summary: Validate user and generate token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0x4C4F1968359425Eb6457Dd89E88EDA18fBC39C45"
 *               hash:
 *                 type: boolean
 *                 example: "true"
 *     responses:
 *       200:
 *         description: User validated successfully
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
 *                   example: "User validated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     streak:
 *                       type: object
 *                       properties:
 *                         currentStreak:
 *                           type: number
 *                         longestStreak:
 *                           type: number
 *                         totalPoints:
 *                           type: number
 *                     streamToken:
 *                       type: string
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /user/calls:
 *   get:
 *     summary: Get user's calls from Stream.io
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User calls retrieved successfully
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
 *                   example: "User calls retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     calls:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Call'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/calls/local:
 *   get:
 *     summary: Get user's calls from local database
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User local calls retrieved successfully
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
 *                   example: "User local calls retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/calls/tips:
 *   get:
 *     summary: Get user's call tips
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tips retrieved successfully
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
 *                   example: "User tips retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: string
 *                             example: "0.1"
 *                           currency:
 *                             type: string
 *                             example: "ETH"
 *                           fromUser:
 *                             $ref: '#/components/schemas/User'
 *                           toUser:
 *                             $ref: '#/components/schemas/User'
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSent:
 *                           type: number
 *                           example: 1.5
 *                         totalReceived:
 *                           type: number
 *                           example: 0.8
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/update:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newusername"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: "User updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */ 