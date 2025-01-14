import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICallActivity {
    date: Date;
    callId: string;
    duration: number;
    isCreator: boolean;
    points: number;
}

export interface IUserStreak extends Document {
    userId: Types.ObjectId;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    totalPoints: number;
    callActivities: ICallActivity[];
    streakHistory: {
        date: Date;
        streak: number;
    }[];
}

const CallActivitySchema = new Schema({
    date: { type: Date, required: true },
    callId: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    isCreator: { type: Boolean, default: false },
    points: { type: Number, required: true },
});

const UserStreakSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    totalPoints: { type: Number, default: 0 },
    callActivities: [CallActivitySchema],
    streakHistory: [{
        date: { type: Date, required: true },
        streak: { type: Number, required: true },
    }],
}, { timestamps: true });

// Index for efficient queries
UserStreakSchema.index({ userId: 1 });
UserStreakSchema.index({ lastActivityDate: 1 });

export const UserStreak = mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);