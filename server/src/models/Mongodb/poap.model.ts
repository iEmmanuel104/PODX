/* eslint-disable @typescript-eslint/no-explicit-any */
// models/Mongodb/poap.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPOAP extends Document {
    sessionId: number;
    callId: string;
    userId: Types.ObjectId;
    mintedAt: Date;
    transactionHash: string;
    tokenId?: number;
    metadataUri: string;
    attributes?: Record<string, any>;
    status: 'pending' | 'minted' | 'failed';
    contractAddress: string;
    mintTransactionHash?: string;
}

const POAPSchema = new Schema({
    sessionId: { type: Number, required: true },
    callId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mintedAt: { type: Date, default: Date.now },
    transactionHash: { type: String, required: true },
    tokenId: { type: Number },
    metadataUri: { type: String, required: true },
    attributes: {
        type: Map,
        of: Schema.Types.Mixed,
    },
    status: {
        type: String,
        enum: ['pending', 'minted', 'failed'],
        default: 'pending',
    },
    contractAddress: { type: String, required: true },
    mintTransactionHash: { type: String },
}, {
    timestamps: true,
});

// Indexes for efficient querying
POAPSchema.index({ sessionId: 1 });
POAPSchema.index({ callId: 1 });
POAPSchema.index({ userId: 1 });
POAPSchema.index({ status: 1 });
POAPSchema.index({ transactionHash: 1 });
POAPSchema.index({ contractAddress: 1 });

export const POAP = mongoose.model<IPOAP>('POAP', POAPSchema);