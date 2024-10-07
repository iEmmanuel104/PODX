import mongoose, { Schema, Document } from 'mongoose';
import { PodType } from '../../socket/socket-helper/interface';

export interface IPod extends Document {
    id: string;
    owner: mongoose.Types.ObjectId;
    hosts: mongoose.Types.ObjectId[];
    members: mongoose.Types.ObjectId[];
    ipfsContentHash: string;
    type: PodType;
    stats: {
        memberCount: number;
        hostCount: number;
        joinRequestCount: number;
        coHostRequestCount: number;
    };
}

const PodSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hosts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ipfsContentHash: { type: String, required: true },
    type: { type: String, enum: ['open', 'trusted'], required: true },
    stats: {
        memberCount: { type: Number, default: 0 },
        hostCount: { type: Number, default: 0 },
        joinRequestCount: { type: Number, default: 0 },
        coHostRequestCount: { type: Number, default: 0 },
    },
}, { timestamps: true });

export const Pod = mongoose.model<IPod>('Pod', PodSchema);