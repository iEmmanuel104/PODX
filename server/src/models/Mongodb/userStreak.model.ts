import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICallActivity {
    date: Date;
    callId: string;
    duration: number;
    isCreator: boolean;
    points: number;
}

export interface IStreakStats {
    createdCalls: number;
    participatedCalls: number;
    totalCalls: number;
    averageCallDuration?: number;
    totalCallDuration?: number;
    longestCallDuration?: number;
    lastCallDate?: Date;
}

export interface IUserStreak extends Document {
    userId: Types.ObjectId;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    totalPoints: number;
    stats: IStreakStats;
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

const StreakStatsSchema = new Schema({
    createdCalls: { type: Number, default: 0 },
    participatedCalls: { type: Number, default: 0 },
    totalCalls: { type: Number, default: 0 },
    averageCallDuration: { type: Number }, // in seconds
    totalCallDuration: { type: Number }, // in seconds
    longestCallDuration: { type: Number }, // in seconds
    lastCallDate: { type: Date },
}, { _id: false });

const UserStreakSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true, 
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    totalPoints: { type: Number, default: 0 },
    stats: { 
        type: StreakStatsSchema, 
        default: () => ({
            createdCalls: 0,
            participatedCalls: 0,
            totalCalls: 0,
        }),
    },
    callActivities: [CallActivitySchema],
    streakHistory: [{
        date: { type: Date, required: true },
        streak: { type: Number, required: true },
    }],
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Compound index for efficient queries
UserStreakSchema.index({ userId: 1, lastActivityDate: 1 });
UserStreakSchema.index({ totalPoints: -1 }); // For leaderboard queries

// Virtual for weekly activity count
UserStreakSchema.virtual('weeklyActivity').get(function() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return this.callActivities.filter(activity => 
        activity.date >= weekAgo
    ).length;
});

// Virtual for average points per call
UserStreakSchema.virtual('averagePointsPerCall').get(function() {
    if (!this.stats.totalCalls) return 0;
    return Math.round(this.totalPoints / this.stats.totalCalls);
});

// Method to calculate engagement score
UserStreakSchema.methods.calculateEngagementScore = function(): number {
    const weightedScore = (
        (this.currentStreak * 10) + 
        (this.stats.totalCalls * 5) + 
        (this.totalPoints * 0.1)
    );
    return Math.round(weightedScore);
};

// Middleware to update stats before saving
UserStreakSchema.pre('save', function(next) {
    if (this.isModified('callActivities')) {
        // Update duration-related stats
        const durations = this.callActivities.map(a => a.duration);
        this.stats.totalCallDuration = durations.reduce((sum, dur) => sum + dur, 0);
        this.stats.averageCallDuration = Math.round(this.stats.totalCallDuration / durations.length);
        this.stats.longestCallDuration = Math.max(...durations);
        
        // Update last call date
        const dates = this.callActivities.map(a => a.date);
        this.stats.lastCallDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }
    next();
});

export const UserStreak = mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);