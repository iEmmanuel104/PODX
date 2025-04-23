import mongoose, { Schema, Document, Types } from 'mongoose';

interface TokenGateInfo {
    enabled: boolean;
    addresses?: string[];
    contractAddress?: string;
    sessionName?: string;
}

interface POAPInfo {
    enabled: boolean;
    contractAddress?: string;
    sessionId?: number;
    sessionTxHash?: string;
    status?: string;
    participantCount?: number;
    creator?: string;
}

interface DurationRequirement {
    value: number;
    type: 'absolute' | 'percentage';
}

interface CallMetadata {
    name: string;
    description: string;
    image: string;
    imageUrl: string;
    metadataUrl: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

export interface ICall extends Document {
    id: string;
    roomId: string; // The Huddle01 room ID (from their API)
    sessionId?: string; // For session tracking
    title: string;
    description: string;
    type: 'audio' | 'video';
    hostWalletAddress: string;
    createdById: Types.ObjectId;
    status: 'created' | 'live' | 'ended';
    startedAt: Date | null;
    endedAt: Date | null;
    duration: number;
    isActive: boolean;
    isPrivate: boolean;
    isScheduled: boolean;
    scheduledTime?: Date;
    tokenGating: {
        enabled: boolean;
        type?: string;
        addresses?: string[];
    };
    members: Array<{
        userId: Types.ObjectId;
        role: string;
    }>;
    totalTips: number;
    tipCount: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    custom?: {
        roomType?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenGateInfo?: any;
        durationRequirement?: DurationRequirement;
        events?: Array<{
            userId: string | Types.ObjectId;
            type: string;
            timestamp: string;
            duration?: number;
        }>;
    };
    ipfsUrl?: string; // Optional IPFS URL for calls with images
}

const callSchema = new Schema<ICall>({
    roomId: { type: String, required: true }, // Store Huddle01 roomId here
    sessionId: { type: String }, // For session tracking
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['audio', 'video'], required: true },
    hostWalletAddress: { type: String, required: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['created', 'live', 'ended'],
        default: 'created',
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false },
    isScheduled: { type: Boolean, default: false },
    scheduledTime: { type: Date },
    tokenGating: {
        enabled: { type: Boolean, default: false },
        type: { type: String },
        addresses: [{ type: String }],
    },
    members: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'guest' },
    }],
    totalTips: { type: Number, default: 0 },
    tipCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    custom: {
        type: Schema.Types.Mixed,
        default: {},
    },
    ipfsUrl: { type: String }, // Store IPFS URL when an image is uploaded
}, {
    timestamps: true,
});

// Transform for JSON responses
callSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// Indexes for efficient queries
callSchema.index({ roomId: 1 }); // Not unique to allow flexibility
callSchema.index({ createdById: 1 });
callSchema.index({ status: 1 });

export const Call = mongoose.model<ICall>('Call', callSchema);