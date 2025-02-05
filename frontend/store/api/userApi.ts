// src/store/api/userApi.ts
import { ApiResponse, apiSlice } from './api';

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

interface ValidateUserArgs {
    walletAddress: string;
    hash?: boolean;
}

type ValidateUserResponse = ApiResponse<UserInfo & { signature?: string }>;

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        validateUser: builder.mutation<ValidateUserResponse, ValidateUserArgs>({
            query: ({ walletAddress, hash }) => ({
                url: '/user/validate',
                method: 'POST',
                body: { walletAddress, ...(hash ? { hash: 'true' } : {}) },
            }),
            invalidatesTags: ['User'],
        }),
        updateUsername: builder.mutation<
            ApiResponse<UserInfo>,
            { userId: string; username: string }
        >({
            query: ({ userId, username }) => ({
                url: '/user/update',
                method: 'PATCH',
                body: { username },
            }),
            invalidatesTags: ['User'],
        }),
        getUser: builder.query<ApiResponse<UserInfo>, string>({
            query: id => {
                const params = new URLSearchParams();
                params.append('id', id);

                return {
                    url: `/user/info?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['User'],
        }),
    }),
});

export const { useValidateUserMutation, useUpdateUsernameMutation, useGetUserQuery } =
    userApiSlice;
