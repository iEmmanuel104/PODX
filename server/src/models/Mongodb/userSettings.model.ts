import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
const BlockUnblockEntrySchema = z.record(z.string());

const BlockMetaSchema = z.object({
    blockHistory: z.array(BlockUnblockEntrySchema),
    unblockHistory: z.array(BlockUnblockEntrySchema),
});

const UserSettingsSchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    userId: z.instanceof(Types.ObjectId),
    joinDate: z.string(),
    lastLogin: z.date().optional(),
    isBlocked: z.boolean(),
    isDeactivated: z.boolean(),
    meta: BlockMetaSchema.optional(),
});

export type UserSettingsType = z.infer<typeof UserSettingsSchema>;
export type IBlockMeta = z.infer<typeof BlockMetaSchema>;

// Extend UserSettingsType with Mongoose's Document properties
interface IUserSettings extends Omit<UserSettingsType, '_id'>, Document { }

// Mongoose schema
const mongooseUserSettingsSchema = new Schema<IUserSettings>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    joinDate: { type: String, required: true },
    lastLogin: { type: Date },
    isBlocked: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false },
    meta: {
        type: {
            blockHistory: [{ type: Map, of: String }],
            unblockHistory: [{ type: Map, of: String }],
        },
        required: false,
    },
}, {
    timestamps: false,
});

// Ensure virtuals are included when converting to JSON
mongooseUserSettingsSchema.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export const UserSettings = model<IUserSettings>('UserSettings', mongooseUserSettingsSchema);

// Export the interface for use in other parts of the application
export { IUserSettings };