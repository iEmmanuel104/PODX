/* eslint-disable @typescript-eslint/no-explicit-any */
// services/tip.service.ts
import { User } from '../models/Mongodb/user.model';
import { Tip, ITip } from '../models/Mongodb/tip.model';
import { Types } from 'mongoose';
import { PopulatedTip, TipSummary, TipsWithSummary, UserBasicInfo } from '../utils/interface';
import { ICall } from 'models/Mongodb/call.model';

export class TipService {
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

            return tip;
        } catch (error) {
            console.error('Error creating tip:', error);
            throw error;
        }
    }

    static async getUserTips(userId: string, type: 'sent' | 'received'): Promise<ITip[]> {
        const query = type === 'sent'
            ? { fromUserId: new Types.ObjectId(userId) }
            : { toUserId: new Types.ObjectId(userId) };

        return await Tip.find(query)
            .sort({ timestamp: -1 })
            .populate('fromUserId', 'username displayImage')
            .populate('toUserId', 'username displayImage');
    }

    static async getCallTips(callId: string): Promise<ITip[]> {
        return await Tip.find({ callId })
            .sort({ timestamp: -1 })
            .populate('fromUserId', 'username displayImage')
            .populate('toUserId', 'username displayImage');
    }

    static async getUserTipsWithCallInfo(
        walletAddress: string,
        filter?: 'sent' | 'received'
    ): Promise<TipsWithSummary> {
        try {
            const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })
                .populate<{
                    _id: Types.ObjectId;
                    sentTips: Array<
                        Omit<ITip, 'fromUserId' | 'toUserId' | 'call'> & {
                            fromUserId: UserBasicInfo;
                            toUserId: UserBasicInfo;
                            call: Omit<ICall, 'createdById'> & {
                                createdById: UserBasicInfo;
                            };
                        }
                    >;
                    receivedTips: Array<
                        Omit<ITip, 'fromUserId' | 'toUserId' | 'call'> & {
                            fromUserId: UserBasicInfo;
                            toUserId: UserBasicInfo;
                            call: Omit<ICall, 'createdById'> & {
                                createdById: UserBasicInfo;
                            };
                        }
                    >;
                }>({
                    path: filter === 'sent' ? 'sentTips' :
                        filter === 'received' ? 'receivedTips' :
                            'sentTips receivedTips',
                    populate: [
                        {
                            path: 'fromUserId',
                            select: 'username displayImage walletAddress',
                        },
                        {
                            path: 'toUserId',
                            select: 'username displayImage walletAddress',
                        },
                        {
                            path: 'call',
                            model: 'Call',
                            select: 'callId type status startTime endTime duration custom createdById',
                            populate: {
                                path: 'createdById',
                                model: 'User',
                                select: 'username displayImage walletAddress',
                            },
                        },
                    ],
                });
            
            if (!user) {
                throw new Error('User not found');
            }

            // Combine tips based on filter
            const tips = filter === 'sent' ? user.sentTips || [] :
                filter === 'received' ? user.receivedTips || [] :
                    [...(user.sentTips || []), ...(user.receivedTips || [])];

            const summary: TipSummary = tips.reduce((acc: TipSummary, tip) => {
                const isSender = tip.fromUserId._id.toString() === user._id.toString();
                const amount = parseFloat(tip.amount);

                if (isSender) {
                    acc.totalSent += amount;
                    acc.tipsSent++;
                } else {
                    acc.totalReceived += amount;
                    acc.tipsReceived++;
                }

                return acc;
            }, {
                totalSent: 0,
                totalReceived: 0,
                tipsSent: 0,
                tipsReceived: 0,
            });

            return {
                tips: tips as PopulatedTip[],
                summary,
            };
        } catch (error) {
            console.error('Error getting user tips:', error);
            throw error;
        }
    }

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
}