import { IUser } from "../models/Mongodb/user.model";
import { Types } from "mongoose";

export interface SaveTokenToCache {
    key: string;
    token: string;
    expiry?: number;
}

export type AuthToken =
    | "access"
    | "refresh"
    | "passwordreset"
    | "emailverification"
    | "setpassword"
    | "adminlogin"
    | "admin";

export type ENCRYPTEDTOKEN = AuthToken | "admin";

export type AWSUploadType = "profile" | "posts" | "document" | "other";

export interface GenerateTokenData {
    type: AuthToken;
    user: DecodedUser;
}
export interface GenerateAdminTokenData {
    type: AuthToken;
    identifier: string;
}

export interface GenerateCodeData {
    type: AuthToken;
    identifier: string;
    expiry: number;
}

export interface CompareTokenData {
    tokenType: AuthToken;
    user: IUser & { id: string };
    token: string;
}
export interface CompareAdminTokenData {
    tokenType: AuthToken;
    identifier: string;
    token: string;
}

export interface DeleteToken {
    tokenType: AuthToken;
    tokenClass: "token" | "code";
    user: IUser & { id: string };
}

export type DecodedUser = { id: string; walletAddress: string };

export interface DecodedTokenData {
    user: DecodedUser;
    token: string;
    tokenType: AuthToken;
    authKey?: string;
    timestamp: number;
    nonce: string;
    walletHash: string;
}

export interface AWSKeyData {
    id: string;
    fileName: string;
    type: AWSUploadType;
}
export interface UserResponse {
    id: string;
    name?: string;
    image?: string;
    banned: boolean;
    online: boolean;
    role: string;
    language: string;
    teams: string[];
    blocked_user_ids: string[];
    created_at: number;
    updated_at: number;
    last_active?: number;
    deactivated_at?: number;
    deleted_at?: number;
    revoke_tokens_issued_before?: number;
    custom: Record<string, unknown>;
}

export interface CallParticipant {
    user: UserResponse;
    role: string;
    user_session_id: string;
    joined_at: number;
}

export interface CallCreatedEvent {
    call: CallResponse;
    call_cid: string;
    created_at: number;
    members: MemberResponse[];
    type: string;
}

export interface CallResponse {
    id: string;
    type: string;
    created_at: number;
    created_by: UserResponse;
    current_session_id?: string;
    ended_at?: number;
    custom?: {
        durationRequirement?: {
            value: number;
            type: "absolute" | "percentage";
        };
        [key: string]: unknown;
    };
    cid: string;
}

export interface MemberResponse {
    user: UserResponse;
    user_id: string;
    role?: string;
    created_at: number;
    custom?: Record<string, unknown>;
}

export interface CallSessionPayload {
    call?: {
        type: string;
        id: string;
        current_session_id?: string;
        session?: {
            participants: CallParticipant[];
        };
    };
    call_cid?: string;
    session_id: string;
    participant: CallParticipant;
    created_at: string;
}

export interface CallSessionEndPayload {
    call_cid: string;
    participant: CallParticipant;
    duration_seconds: number;
    created_at: string;
}

export interface CustomEventPayload {
    call_cid: string;
    created_at: string;
    custom: {
        type: string;
        amount: unknown;
        from: {
            id: string;
            name: string;
        };
        to: {
            id: string;
            name: string;
        };
        currency: string;
        timestamp: string;
        transactionHash?: string;
    };
    type: string;
    user: UserResponse;
}

export interface ProcessingError {
    userId?: string;
    callId?: string;
    error: string;
    timestamp: Date;
}

export interface ProcessingSummary {
    totalUsersProcessed: number;
    totalCallsProcessed: number;
    totalStreakUpdates: number;
    errors: ProcessingError[];
    processingTime: number;
}

interface UserBasicInfo {
    _id: Types.ObjectId;
    username: string;
    displayImage?: string;
    walletAddress: string;
}

interface CallInfoPopulated {
    callId: string;
    type: string;
    status: "created" | "live" | "ended";
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    custom?: Record<string, unknown>;
    createdById: UserBasicInfo;
}

interface PopulatedTip {
    _id: Types.ObjectId;
    callId: string; // The string callId
    call: CallInfoPopulated; // The populated call information
    fromUserId: UserBasicInfo;
    toUserId: UserBasicInfo;
    amount: string;
    timestamp: Date;
    status: "pending" | "completed" | "failed";
    currency: string;
    transactionHash?: string;
}

interface TipSummary {
    totalSent: number;
    totalReceived: number;
    tipsSent: number;
    tipsReceived: number;
}

interface TipsWithSummary {
    tips: PopulatedTip[];
    summary: TipSummary;
}

type TipQueryFilter = {
    fromUserId?: Types.ObjectId;
    toUserId?: Types.ObjectId;
    $or?: Array<{ fromUserId: Types.ObjectId } | { toUserId: Types.ObjectId }>;
};

export {
    UserBasicInfo,
    CallInfoPopulated,
    PopulatedTip,
    TipSummary,
    TipsWithSummary,
    TipQueryFilter,
};
