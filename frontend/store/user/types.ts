export interface UserInfo {
    id: string;
    walletAddress: string;
    username: string;
    streamToken: string;
    streak: {
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
    };
    displayImage?: string;
    walletType?: string;
    signature?: string;
    firstTimeUser: boolean;
}

export interface UpdateUsernameResponse {
    status: string;
    message: string;
    data: UserInfo;
}

export interface ValidateUserResponse {
    data: UserInfo & { signature?: string };
};

export interface ValidateUserArgs {
    walletAddress: string;
    hash?: boolean;
}

export interface UpdateUsernameArgs {
    userId: string;
    username: string;
}

export interface QueryParams {
    [key: string]: number | string;
}


export interface CallMember {
    userId: {
        id: string;
        walletAddress: string;
        username: string;
        displayImage?: string;
    };
    role?: string;
}

export interface Call {
    _id: string;
    poa?: {
        image: string;
        transaction: string;
    };
    callId: string;
    type: string;
    status: 'created' | 'live' | 'ended';
    createdById: {
        walletAddress: string;
        username: string;
        displayImage?: string;
    };
    members: CallMember[];
    sessionId?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    custom?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface GetUserCallsResponse {
    status: string;
    message: string;
    data: {
        calls: Call[];
        total: number;
        filter: 'all' | 'creator' | 'member' | 'tokengate';
    };
}

export interface GetUserCallsArgs {
    filter?: 'creator' | 'member' | 'tokengate';
}