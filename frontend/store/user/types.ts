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
