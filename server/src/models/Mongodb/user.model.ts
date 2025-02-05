import { Schema, model, Document, Types } from 'mongoose';
import { IUserSettings } from './userSettings.model';
import { IUserStreak } from './userStreak.model';

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
}

const mongooseUserSchema = new Schema<IUser>({
    walletAddress: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, lowercase: true },
    displayImage: String,
    ownedPods: [{ type: Schema.Types.ObjectId, ref: 'Pod' }],
    memberPods: [{ type: Schema.Types.ObjectId, ref: 'Pod' }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

mongooseUserSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

mongooseUserSchema.virtual('settings', {
    ref: 'UserSettings',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});

mongooseUserSchema.virtual('streak', {
    ref: 'UserStreak',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});

export const User = model<IUser>('User', mongooseUserSchema);