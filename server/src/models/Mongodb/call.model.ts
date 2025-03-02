import mongoose, { Schema, Document, Types } from 'mongoose';

interface TokenGateInfo {
    enabled?: boolean;
    addresses?: string[];
    contractAddress?: string;
    sessionName?: string;
}

interface POAPInfo {
    contractAddress?: string;
    sessionId?: number;
    sessionTxHash?: string;
    status?: string;
    participantCount?: number;
    creator?: string;
}

interface CallCustom {
    title?: string;
    type?: string;
    tokenGateInfo?: TokenGateInfo;
    poap?: POAPInfo;
    events?: any[];
    [key: string]: any; // Allow other properties
}

export interface ICall extends Document {
    callId: string;
    type: string;
    createdById: Types.ObjectId;
    status: 'created' | 'live' | 'ended';
    members: Array<{
        userId: Types.ObjectId;
        role?: string;
    }>;
    sessionId?: string;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    custom?: CallCustom;
    scheduledDuration: number;
    endedBy: Types.ObjectId;
}

const CallSchema = new Schema({
    callId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['created', 'live', 'ended'],
        default: 'created',
    },
    members: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: String,
    }],
    sessionId: String,
    startTime: Date,
    endTime: Date,
    duration: Number,
    custom: {
        type: Schema.Types.Mixed,
        default: {},
    } as any,
    scheduledDuration: { 
        type: Number,  // in minutes
        required: true 
    },
    endedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
});

// Indexes for efficient queries
CallSchema.index({ callId: 1 });
CallSchema.index({ createdById: 1 });
CallSchema.index({ status: 1 });
CallSchema.index({ 'members.userId': 1 });

export const Call = mongoose.model<ICall>('Call', CallSchema);