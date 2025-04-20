/* eslint-disable @typescript-eslint/no-explicit-any */
// services/tip.service.ts
import { User, IUser } from '../models/Mongodb/user.model';
import { Tip, ITip } from '../models/Mongodb/tip.model';
import { Types } from 'mongoose';
import { PopulatedTip, TipSummary, TipsWithSummary, UserBasicInfo } from '../utils/interface';
import { ICall } from '../models/Mongodb/call.model';
import { Call } from '../models/Mongodb/call.model';

export class TipService {
    /**
     * Create a new tip transaction
     */
    static async createTip(
        callId: string,
        sessionId: string | undefined,
        fromUserId: string,
        toUserId: string,
        amount: string,
        currency: string = 'USDC',
        timestamp: string | Date = new Date(),
        transactionHash?: string,
    ): Promise<ITip> {
        try {
            const tipTimestamp = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

            const tip = await Tip.create({
                callId,
                sessionId,
                fromUserId: new Types.ObjectId(fromUserId),
                toUserId: new Types.ObjectId(toUserId),
                amount,
                transactionHash,
                currency,
                timestamp: tipTimestamp,
                status: transactionHash ? 'completed' : 'pending',
            });

            // Update call statistics
            const call = await Call.findById(callId);
            if (call) {
                const numAmount = parseFloat(amount);
                call.totalTips = (call.totalTips || 0) + numAmount;
                call.tipCount = (call.tipCount || 0) + 1;
                await call.save();
            }

            return tip;
        } catch (error) {
            console.error('Error creating tip:', error);
            throw error;
        }
    }

    /**
     * Get tips for a user (sent, received, or both)
     */
    static async getUserTips(userId: string, type?: 'sent' | 'received'): Promise<any> {
        try {
            if (type === 'sent') {
                return await Tip.find({ fromUserId: new Types.ObjectId(userId) })
                    .sort({ timestamp: -1 })
                    .populate('fromUserId', 'username displayImage')
                    .populate('toUserId', 'username displayImage')
                    .populate('callId', 'title roomId');
            } else if (type === 'received') {
                return await Tip.find({ toUserId: new Types.ObjectId(userId) })
                    .sort({ timestamp: -1 })
                    .populate('fromUserId', 'username displayImage')
                    .populate('toUserId', 'username displayImage')
                    .populate('callId', 'title roomId');
            } else {
                // Get both sent and received
                const [sentTips, receivedTips] = await Promise.all([
                    Tip.find({ fromUserId: new Types.ObjectId(userId) })
                        .populate('fromUserId', 'username displayImage')
                        .populate('toUserId', 'username displayImage')
                        .populate('callId', 'title roomId')
                        .sort({ timestamp: -1 }),
                    Tip.find({ toUserId: new Types.ObjectId(userId) })
                        .populate('fromUserId', 'username displayImage')
                        .populate('toUserId', 'username displayImage')
                        .populate('callId', 'title roomId')
                        .sort({ timestamp: -1 }),
                ]);
                
                return { sentTips, receivedTips };
            }
        } catch (error) {
            console.error('Error getting user tips:', error);
            throw error;
        }
    }

    /**
     * Get all tips for a specific call
     */
    static async getTipsForCall(callId: string) {
        try {
            const tips = await Tip.find({ callId: new Types.ObjectId(callId) })
                .populate('fromUserId', 'username displayImage')
                .populate('toUserId', 'username displayImage')
                .sort({ timestamp: -1 });
            
            return tips;
        } catch (error) {
            console.error('Error getting tips for call:', error);
            throw error;
        }
    }

    /**
     * Get tip statistics for a user
     */
    static async getUserTipStats(userId: string): Promise<{
        totalSent: number;
        totalReceived: number;
        tipsSent: number;
        tipsReceived: number;
    }> {
        const [sentTips, receivedTips] = await Promise.all([
            Tip.find({ fromUserId: new Types.ObjectId(userId), status: 'completed' }),
            Tip.find({ toUserId: new Types.ObjectId(userId), status: 'completed' }),
        ]);

        return {
            totalSent: sentTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0),
            totalReceived: receivedTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0),
            tipsSent: sentTips.length,
            tipsReceived: receivedTips.length,
        };
    }

    /**
     * Update the status of a tip
     */
    static async updateTipStatus(
        tipId: string,
        status: 'completed' | 'failed',
        transactionHash?: string
    ): Promise<ITip | null> {
        return await Tip.findByIdAndUpdate(
            tipId,
            {
                status,
                ...(transactionHash && { transactionHash }),
            },
            { new: true }
        );
    }

    /**
     * Handle tip received webhook
     * @deprecated Use createTip instead
     */
    static async handleTipReceived(roomId: string, senderId: string, recipientId: string, amount: number) {
        try {
            // Validate call
            const call = await Call.findOne({ roomId });
            if (!call) {
                throw new Error('Call not found');
            }

            // Validate users
            const [sender, recipient] = await Promise.all([
                User.findById(senderId),
                User.findById(recipientId),
            ]);

            if (!sender) {
                throw new Error('Tip sender not found');
            }

            if (!recipient) {
                throw new Error('Tip recipient not found');
            }

            // Create tip record
            const tip = await Tip.create({
                callId: call._id,
                fromUserId: sender._id,
                toUserId: recipient._id,
                amount,
                timestamp: new Date(),
            });

            // Update call statistics
            call.totalTips = (call.totalTips || 0) + amount;
            call.tipCount = (call.tipCount || 0) + 1;
            await call.save();

            return tip;
        } catch (error) {
            console.error('Error handling tip received:', error);
            throw error;
        }
    }

    /**
     * Get tips for a user with call information
     * @param walletAddress Wallet address of the user
     * @param type Type of tips to retrieve (sent, received, or both)
     */
    static async getUserTipsWithCallInfo(walletAddress: string, type?: 'sent' | 'received'): Promise<any> {
        try {
            // First, find the user by wallet address
            const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            if (!user) {
                throw new Error('User not found');
            }

            // Get the user ID as a string
            const userId = user._id ? user._id.toString() : null;
            if (!userId) {
                throw new Error('Invalid user ID');
            }

            // Now use the getUserTips method with the user's ID
            return this.getUserTips(userId, type);
        } catch (error) {
            console.error('Error getting user tips with call info:', error);
            throw error;
        }
    }
}