import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';
import isEmail from 'validator/lib/isEmail';

// Zod schema for validation
const AdminSchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    name: z.string(),
    email: z.string().email(),
    isSuperAdmin: z.boolean().optional(),
});

type AdminType = z.infer<typeof AdminSchema>;

// Extend AdminType with Mongoose's Document properties
interface IAdmin extends Omit<AdminType, '_id'>, Document {
    // '_id' is already included in Document, so we omit it from AdminType
}

// Mongoose schema
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

// We don't need to define a virtual for 'id' as Mongoose automatically adds
// a virtual 'id' getter that returns the '_id' as a string

// Ensure virtuals are included when converting to JSON
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

// Export the interface for use in other parts of the application
export { IAdmin };