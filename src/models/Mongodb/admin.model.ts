import { Schema, model, Document } from 'mongoose';
import isEmail from 'validator/lib/isEmail';

export interface IAdmin extends Document {
    name: string;
    email: string;
    isSuperAdmin?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const mongooseAdminSchema = new Schema<IAdmin>({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [isEmail, 'Invalid email address'],
    },
    isSuperAdmin: { type: Boolean, default: false },
}, {
    timestamps: true,
});

mongooseAdminSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export const Admin = model<IAdmin>('Admin', mongooseAdminSchema);