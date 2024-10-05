import { Schema, model, Document } from 'mongoose';
import { z } from 'zod';

const UserSchema = z.object({
    walletAddress: z.string().toLowerCase(),
    firstName: z.string(),
    lastName: z.string(),
    otherName: z.string().optional(),
    username: z.string().toLowerCase(),
    displayImage: z.string().optional(),
});

type UserType = z.infer<typeof UserSchema>;

const mongooseUserSchema = new Schema<UserType & Document>({
    walletAddress: { type: String, required: true, unique: true, lowercase: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherName: String,
    username: { type: String, required: true, unique: true, lowercase: true },
    displayImage: String,
}, { timestamps: true });

export interface IUser extends UserType, Document { }

export const User = model<IUser>('User', mongooseUserSchema);