// src/store/api/userApi.ts
import { ApiResponse, apiSlice } from './api';

export interface UserInfo {
    id: string;
    walletAddress: string;
    username: string;
    streamToken: string;
    displayImage?: string;
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
        updateUsername: builder.mutation<ApiResponse<UserInfo>, { username: string, signature: string, message: string, address: string }>({
            query: (body) => ({
                url: '/user/update-username',
                method: 'PATCH',
                body,
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
