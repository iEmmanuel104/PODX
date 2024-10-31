import mongoose, { Schema, Document } from 'mongoose';

export type PodType = 'default' | 'audio_room' | 'livestream'

export interface IPod extends Document {
    id: string;
    owner: mongoose.Types.ObjectId;
    hosts: mongoose.Types.ObjectId[];
    members: mongoose.Types.ObjectId[];
    meetingId: string;
    type: PodType;
    stats: {
        memberCount: number;
        hostCount: number;
    };
    startTime: Date;
}

const PodSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hosts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    meetingId: { type: String, required: true },
    type: { type: String, enum: ['default' , 'audio_room' , 'livestream'], required: true },
    stats: {
        memberCount: { type: Number, default: 0 },
        hostCount: { type: Number, default: 0 },
    },
    startTime: { type: Date },
}, { timestamps: true });

export const Pod = mongoose.model<IPod>('Pod', PodSchema);