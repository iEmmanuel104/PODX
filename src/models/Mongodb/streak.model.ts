import mongoose, { Schema, Document } from "mongoose";

export interface IStreak extends Document {
    userId: mongoose.Types.ObjectId;
    currentStreak: number;
    longestStreak: number;
    lastCallDate: Date;
    totalCalls: number;
    totalMinutes: number;
    averageCallDuration: number;
}

const StreakSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        currentStreak: {
            type: Number,
            default: 0,
            min: 0,
        },
        longestStreak: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastCallDate: {
            type: Date,
            default: null,
        },
        totalCalls: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalMinutes: {
            type: Number,
            default: 0,
            min: 0,
        },
        averageCallDuration: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes
StreakSchema.index({ currentStreak: -1 });
StreakSchema.index({ longestStreak: -1 });
StreakSchema.index({ totalCalls: -1 });

export const Streak = mongoose.model<IStreak>("Streak", StreakSchema);
