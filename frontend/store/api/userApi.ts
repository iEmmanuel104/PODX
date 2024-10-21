// src/store/api/userApi.ts
import { ApiResponse, apiSlice } from './api';

export interface UserInfo {
    id: string;
    walletAddress: string;
    username: string;
    streamToken: string;
    displayImage?: string;
    walletType?: string;
    signature?: string;
}

interface FindOrCreateUserArgs {
    walletAddress: string;
    hash?: boolean;
}

type FindOrCreateUserResponse = ApiResponse<UserInfo & { signature?: string }>;

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        findOrCreateUser: builder.mutation<FindOrCreateUserResponse, FindOrCreateUserArgs>({
            query: ({ walletAddress, hash }) => ({
                url: '/user/validate',
                method: 'POST',
                body: { walletAddress, ...(hash ? { hash: 'true' } : {}) },
            }),
            invalidatesTags: ['User'],
        }),
        updateUsername: builder.mutation<ApiResponse<UserInfo>, { userId: string; username: string }>({
            query: ({ userId, username }) => ({
                url: '/user/update',
                method: 'PATCH',
                body: { username },
            }),
            invalidatesTags: ['User'],
        }),
        getUser: builder.query<ApiResponse<UserInfo>, string>({
            query: (id) => {
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

export const {
    useFindOrCreateUserMutation,
    useUpdateUsernameMutation,
    useGetUserQuery,
} = userApiSlice;