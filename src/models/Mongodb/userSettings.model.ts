import { Schema, model, Document, Types } from "mongoose";

export interface IBlockHistoryEntry {
    [key: string]: string;
}

export interface IBlockMeta {
    blockHistory: IBlockHistoryEntry[];
    unblockHistory: IBlockHistoryEntry[];
}

export interface IUserSettings extends Document {
    userId: Types.ObjectId;
    joinDate: string;
    lastLogin?: Date;
    isBlocked: boolean;
    isDeactivated: boolean;
    meta?: IBlockMeta;
    createdAt?: Date;
    updatedAt?: Date;
}

const mongooseUserSettingsSchema = new Schema<IUserSettings>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
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
    },
    {
        timestamps: false,
    },
);

mongooseUserSettingsSchema.set("toJSON", {
    virtuals: true,
    transform: (_, ret) => {
        ret.id = ret._id.toHexString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export const UserSettings = model<IUserSettings>(
    "UserSettings",
    mongooseUserSettingsSchema,
);
