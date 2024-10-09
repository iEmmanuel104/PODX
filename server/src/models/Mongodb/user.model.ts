import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';
import { IUserSettings } from './userSettings.model';

// Zod schema for validation
const UserSchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    walletAddress: z.string().toLowerCase(),
    username: z.string().toLowerCase(),
    displayImage: z.string().optional(),
    ownedPods: z.array(z.instanceof(Types.ObjectId)),
    memberPods: z.array(z.instanceof(Types.ObjectId)),
});

type UserType = z.infer<typeof UserSchema>;

// Extend UserType with Mongoose's Document properties
interface IUser extends Omit<UserType, '_id'>, Document {
    settings?: IUserSettings; // Add this line
}

// Mongoose schema
const mongooseUserSchema = new Schema<IUser>({
    walletAddress: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    displayImage: String,
    ownedPods: [{ type: Schema.Types.ObjectId, ref: 'Pod' }],
    memberPods: [{ type: Schema.Types.ObjectId, ref: 'Pod' }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Ensure virtuals are included when converting to JSON
mongooseUserSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export const User = model<IUser>('User', mongooseUserSchema);

// Export the interface for use in other parts of the application
export { IUser };