import express, { Router } from 'express';
import { TipService } from '../services/tip.service';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tips
 *   description: Tip management endpoints
 * 
 * components:
 *   schemas:
 *     Tip:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a9d1f28d79c5223e7c3f12"
 *         callId:
 *           type: string
 *           example: "64a9d1e08d79c5223e7c3f10"
 *         fromUserId:
 *           type: string
 *           example: "64a9d1d08d79c5223e7c3f08"
 *         toUserId:
 *           type: string
 *           example: "64a9d1d58d79c5223e7c3f09"
 *         amount:
 *           type: string
 *           example: "5.00"
 *         currency:
 *           type: string
 *           example: "USDC"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2023-07-08T15:30:42.123Z"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           example: "completed"
 *         transactionHash:
 *           type: string
 *           example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 */

/**
 * @swagger
 * /tips/create:
 *   post:
 *     summary: Create a new tip transaction
 *     description: Send a tip from one user to another during a call
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callId
 *               - recipientId
 *               - amount
 *             properties:
 *               callId:
 *                 type: string
 *                 description: ID of the call where the tip is being sent
 *                 example: "64a9d1e08d79c5223e7c3f10"
 *               recipientId:
 *                 type: string
 *                 description: ID of the user receiving the tip
 *                 example: "64a9d1d58d79c5223e7c3f09"
 *               amount:
 *                 type: number
 *                 description: Amount being tipped
 *                 minimum: 0.01
 *                 example: 5.00
 *               currency:
 *                 type: string
 *                 default: "USDC"
 *                 description: Currency of the tip
 *                 example: "USDC"
 *     responses:
 *       200:
 *         description: Tip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tip:
 *                   $ref: '#/components/schemas/Tip'
 *                 message:
 *                   type: string
 *                   example: "Tip sent successfully"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', basicAuth(), AuthenticatedController(async (req, res) => {
    try {
        const { callId, recipientId, amount, currency = 'USDC' } = req.body;
        const senderUserId = req.user?.id;

        if (!callId || !recipientId || !amount || !senderUserId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (senderUserId === recipientId) {
            return res.status(400).json({ error: 'Cannot send tip to yourself' });
        }

        // Validate amount
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const tip = await TipService.createTip(
            callId,
            undefined, // sessionId
            senderUserId,
            recipientId,
            amount.toString(),
            currency,
            new Date()
        );

        return res.status(200).json({ 
            success: true, 
            tip,
            message: 'Tip sent successfully',
        });
    } catch (error) {
        console.error('Error creating tip:', error);
        return res.status(500).json({ 
            error: 'Failed to process tip',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));

/**
 * @swagger
 * /tips/user/{type}:
 *   get:
 *     summary: Get tips for a user
 *     description: Retrieve tips sent or received by the authenticated user
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sent, received, all]
 *           example: all
 *         description: Type of tips to retrieve
 *     responses:
 *       200:
 *         description: User tips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentTips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tip'
 *                 receivedTips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tip'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user/:type', basicAuth(), AuthenticatedController(async (req, res) => {
    try {
        const { type } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!['sent', 'received', 'all'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type parameter' });
        }

        if (type === 'all') {
            const { sentTips, receivedTips } = await TipService.getUserTips(userId);
            return res.status(200).json({ sentTips, receivedTips });
        } else {
            const tips = await TipService.getUserTips(userId, type as 'sent' | 'received');
            return res.status(200).json({ tips });
        }
    } catch (error) {
        console.error('Error getting user tips:', error);
        return res.status(500).json({ 
            error: 'Failed to retrieve tips',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));

/**
 * @swagger
 * /tips/call/{callId}:
 *   get:
 *     summary: Get tips for a call
 *     description: Retrieve all tips sent during a specific call
 *     tags: [Tips]
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *           example: "64a9d1e08d79c5223e7c3f10"
 *         description: ID of the call to retrieve tips for
 *     responses:
 *       200:
 *         description: Call tips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tip'
 *       400:
 *         description: Invalid callId
 *       500:
 *         description: Server error
 */
router.get('/call/:callId', async (req, res) => {
    try {
        const { callId } = req.params;
        
        if (!callId) {
            return res.status(400).json({ error: 'CallId is required' });
        }

        const tips = await TipService.getTipsForCall(callId);
        return res.status(200).json({ tips });
    } catch (error) {
        console.error('Error getting call tips:', error);
        return res.status(500).json({ 
            error: 'Failed to retrieve call tips',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * @swagger
 * /tips/stats/{userId}:
 *   get:
 *     summary: Get tip statistics for a user
 *     description: Retrieve tip statistics including total sent, received, counts, etc.
 *     tags: [Tips]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "64a9d1d08d79c5223e7c3f08"
 *         description: ID of the user to retrieve tip stats for
 *     responses:
 *       200:
 *         description: User tip stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSent:
 *                   type: number
 *                   example: 25.00
 *                 totalReceived:
 *                   type: number
 *                   example: 15.50
 *                 tipsSent:
 *                   type: number
 *                   example: 5
 *                 tipsReceived:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Invalid userId
 *       500:
 *         description: Server error
 */
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'UserId is required' });
        }

        const stats = await TipService.getUserTipStats(userId);
        return res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting user tip stats:', error);
        return res.status(500).json({ 
            error: 'Failed to retrieve tip statistics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router; 