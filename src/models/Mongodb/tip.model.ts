// models/Mongodb/tip.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITip extends Document {
    callId: mongoose.Types.ObjectId;
    sessionId?: string;
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    amount: string;
    currency: string;
    timestamp: Date;
    status: "pending" | "completed" | "failed";
    transactionHash?: string;
}

const TipSchema: Schema = new Schema(
    {
        callId: {
            type: Schema.Types.ObjectId,
            ref: "Call",
            required: true,
        },
        sessionId: {
            type: String,
            required: false,
        },
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
            default: "USDC",
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        transactionHash: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes
TipSchema.index({ callId: 1 });
TipSchema.index({ fromUserId: 1 });
TipSchema.index({ toUserId: 1 });
TipSchema.index({ timestamp: -1 });
TipSchema.index({ status: 1 });

export const Tip = mongoose.model<ITip>("Tip", TipSchema);
