import { createApi, fetchBaseQuery, BaseQueryFn, FetchBaseQueryError, FetchArgs } from '@reduxjs/toolkit/query/react';
import { ethers } from 'ethers';
import { RootState } from '../index';
import { logOut, setSignature, setUser } from '../slices/userSlice';
import { SERVER_URL, SIGNATURE_MESSAGE } from '@/constants';

export interface ApiResponse<T> {
    status: string;
    message: string;
    data?: T;
    error?: boolean;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await fetchBaseQuery({
        baseUrl: SERVER_URL,
        prepareHeaders: async (headers, { getState }) => {
            const state = getState() as RootState;
            const { user, signature } = state.user;

            if (user?.walletAddress && signature) {
                headers.set('Authorization', `Bearer ${signature}`);
            }

            return headers;
        },
    })(args, api, extraOptions);

    if (result.error && result.error.status === 401 && (result.error.data as ApiResponse<unknown>).message === 'Token expired') {
        // Token has expired, request a new one
        const state = api.getState() as RootState;
        const { user } = state.user;

        if (user?.walletAddress) {
            try {
                const body = new URLSearchParams();
                body.append('walletAddress', user.walletAddress);
                body.append('hash', 'true');

                const refreshResult = await fetchBaseQuery({
                    baseUrl: SERVER_URL,
                })({
                    url: '/user/validate',
                    method: 'POST',
                    body,
                }, api, extraOptions);

                if (refreshResult.data) {
                    const refreshData = refreshResult.data as ApiResponse<{ signature: string }>;
                    api.dispatch(setSignature(refreshData.data!.signature));

                    // Retry the original query with the new token
                    return baseQuery(args, api, extraOptions);
                } else {
                    api.dispatch(logOut());
                }
            } catch {
                api.dispatch(logOut());
            }
        } else {
            api.dispatch(logOut());
        }
    }

    if (result.error) {
        const errorData = result.error.data as ApiResponse<null>;
        console.error('API Error:', errorData);
        return { error: result.error };
    }

    const successData = result.data as ApiResponse<unknown>;
    // console.log('API Success:', successData);

    return { data: successData };
};

export const apiSlice = createApi({
    baseQuery: baseQuery,
    tagTypes: ['User', 'Pod'],
    endpoints: () => ({}),
});