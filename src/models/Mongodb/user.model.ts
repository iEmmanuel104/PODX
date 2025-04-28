// models/Mongodb/user.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IUserSettings } from "./userSettings.model";
import { IUserStreak } from "./userStreak.model";
import { ITip } from "./tip.model";

export interface IUser extends Document {
    walletAddress: string;
    username: string;
    displayImage?: string;
    ownedPods: Types.ObjectId[];
    memberPods: Types.ObjectId[];
    settings?: IUserSettings;
    streak?: IUserStreak;
    createdAt: Date;
    updatedAt: Date;
    sentTips?: ITip[];
    receivedTips?: ITip[];
}

const mongooseUserSchema = new Schema<IUser>(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        username: { type: String, required: true, lowercase: true },
        displayImage: String,
        ownedPods: [{ type: Schema.Types.ObjectId, ref: "Pod" }],
        memberPods: [{ type: Schema.Types.ObjectId, ref: "Pod" }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Existing virtuals
mongooseUserSchema.virtual("settings", {
    ref: "UserSettings",
    localField: "_id",
    foreignField: "userId",
    justOne: true,
});

mongooseUserSchema.virtual("streak", {
    ref: "UserStreak",
    localField: "_id",
    foreignField: "userId",
    justOne: true,
});

// Add virtual for sent tips
mongooseUserSchema.virtual("sentTips", {
    ref: "Tip",
    localField: "_id",
    foreignField: "fromUserId",
    options: { sort: { timestamp: -1 } },
});

// Add virtual for received tips
mongooseUserSchema.virtual("receivedTips", {
    ref: "Tip",
    localField: "_id",
    foreignField: "toUserId",
    options: { sort: { timestamp: -1 } },
});

// Keep existing toJSON transform
mongooseUserSchema.set("toJSON", {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export const User = model<IUser>("User", mongooseUserSchema);
