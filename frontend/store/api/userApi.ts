// src/store/api/userApi.ts
import { ApiResponse, apiSlice } from './api';

export interface UserInfo {
    id: string;
    walletAddress: string;
    username: string;
    smartWalletAddress?: string;
    smartWalletType?: string;
}

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        findOrCreateUser: builder.mutation<ApiResponse<UserInfo>, { walletAddress: string }>({
            query: (body) => ({
                url: '/user/validate',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),
        updateUsername: builder.mutation<ApiResponse<UserInfo>, { userId: string; username: string }>({
            query: ({ userId, username }) => ({
                url: `/user/update/${userId}`,
                method: 'PUT',
                body: { username },
            }),
            invalidatesTags: ['User'],
        }),
        getUser: builder.query<ApiResponse<UserInfo>, string>({
            query: (userId) => `/user/info/${userId}`,
            providesTags: ['User'],
        }),
    }),
});

export const {
    useFindOrCreateUserMutation,
    useUpdateUsernameMutation,
    useGetUserQuery,
} = userApiSlice;