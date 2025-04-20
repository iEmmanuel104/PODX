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
 *     summary: Get user by wallet address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user to query
 *         example: "0x4C4F1968359425Eb6457Dd89E88EDA18fBC39C45"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: "User retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request, wallet address is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
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
 * /user/update:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "seyi-idowu"
 *                 description: New username to update
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
 *                   type: object
 *                   properties:
 *                     walletAddress:
 *                       type: string
 *                       example: "0x4c4f1968359425eb6457dd89e88eda18fbc39c45"
 *                     username:
 *                       type: string
 *                       example: "seyi-idowu"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-01T15:31:18.033Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-04T14:40:09.316Z"
 *                     id:
 *                       type: string
 *                       example: "679e3e46bcf604856ee5d5d8"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */ 