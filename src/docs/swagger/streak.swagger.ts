/**
 * @swagger
 * tags:
 *   name: Streaks
 *   description: User streak management endpoints
 */

/**
 * @swagger
 * /streak/leaderboard:
 *   get:
 *     summary: Get streak leaderboard
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
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
 *                   example: "Leaderboard retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "6442a55d8d99b93c05c0feac"
 *                       username:
 *                         type: string
 *                         example: "user123"
 *                       currentStreak:
 *                         type: number
 *                         example: 7
 *                       longestStreak:
 *                         type: number
 *                         example: 14
 *                       totalPoints:
 *                         type: number
 *                         example: 1500
 */

/**
 * @swagger
 * /streak/sync-user:
 *   post:
 *     summary: Recalculate streak for a specific user
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User streak recalculated successfully
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
 *                   example: "User streak recalculated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentStreak:
 *                       type: number
 *                       example: 5
 *                     longestStreak:
 *                       type: number
 *                       example: 10
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /streak/sync-local:
 *   post:
 *     summary: Recalculate streaks for all users from local data
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: All streaks recalculated successfully
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
 *                   example: "All streaks recalculated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     usersProcessed:
 *                       type: number
 *                       example: 150
 *                     streaksUpdated:
 *                       type: number
 *                       example: 75
 */

/**
 * @swagger
 * /streak/sync-streamio:
 *   post:
 *     summary: Sync streaks with Stream.io data
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: Streaks synced with Stream.io successfully
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
 *                   example: "Streaks synced with Stream.io successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     callsProcessed:
 *                       type: number
 *                       example: 200
 *                     streaksUpdated:
 *                       type: number
 *                       example: 85
 */ 