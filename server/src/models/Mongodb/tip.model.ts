// models/Mongodb/tip.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITip extends Document {
    callId: string;  // Changed to string to match Call model
    call: Types.ObjectId;  // Added to reference Call document
    sessionId?: string;
    fromUserId: Types.ObjectId;
    toUserId: Types.ObjectId;
    amount: string;
    timestamp: Date;
    transactionHash?: string;
    status: 'pending' | 'completed' | 'failed';
    currency: string;
}

const TipSchema = new Schema({
    callId: { type: String, required: true },  // String field for the callId
    call: { type: Schema.Types.ObjectId, ref: 'Call', required: true },  // Reference to Call document
    sessionId: { type: String },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    transactionHash: { type: String },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    currency: { type: String, default: 'USDC' },
}, {
    timestamps: true,
});

// Updated indexes
TipSchema.index({ callId: 1 });
TipSchema.index({ call: 1 });
TipSchema.index({ fromUserId: 1 });
TipSchema.index({ toUserId: 1 });
TipSchema.index({ timestamp: 1 });
TipSchema.index({ status: 1 });

export const Tip = mongoose.model<ITip>('Tip', TipSchema);