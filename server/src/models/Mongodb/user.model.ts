import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
const UserSchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    walletAddress: z.string().toLowerCase(),
    firstName: z.string(),
    lastName: z.string(),
    otherName: z.string().optional(),
    username: z.string().toLowerCase(),
    displayImage: z.string().optional(),
});

type UserType = z.infer<typeof UserSchema>;

// Extend UserType with Mongoose's Document properties
interface IUser extends Omit<UserType, '_id'>, Document {
    fullName: string;
}

// Mongoose schema
const mongooseUserSchema = new Schema<IUser>({
    walletAddress: { type: String, required: true, unique: true, lowercase: true },
    firstName: {
        type: String,
        required: true,
        set: (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
    },
    lastName: {
        type: String,
        required: true,
        set: (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
    },
    otherName: {
        type: String,
        set: (v: string | undefined) => v ? v.charAt(0).toUpperCase() + v.slice(1) : v,
    },
    username: { type: String, required: true, unique: true, lowercase: true },
    displayImage: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for fullName
// eslint-disable-next-line no-unused-vars
mongooseUserSchema.virtual('fullName').get(function (this: IUser) {
    if (this.otherName) {
        return `${this.firstName} ${this.lastName} ${this.otherName}`.trim();
    } else {
        return `${this.firstName} ${this.lastName}`.trim();
    }
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

// Pre-save hook for capitalization
mongooseUserSchema.pre('save', function (this: IUser, next) {
    if (this.isModified('firstName')) {
        this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1);
    }
    if (this.isModified('lastName')) {
        this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1);
    }
    if (this.isModified('otherName') && this.otherName) {
        this.otherName = this.otherName.charAt(0).toUpperCase() + this.otherName.slice(1);
    }
    next();
});

export const User = model<IUser>('User', mongooseUserSchema);