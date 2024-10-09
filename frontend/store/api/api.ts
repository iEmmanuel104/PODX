// src/store/api/api.ts
import { createApi, fetchBaseQuery, BaseQueryFn, FetchBaseQueryError, FetchArgs } from '@reduxjs/toolkit/query/react';
import { ethers } from 'ethers';
import { RootState } from '../index';
import { logOut, setSignature } from '../slices/userSlice';

export interface ApiResponse<T> {
    status: string;
    message: string;
    data?: T;
    error?: boolean;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: async (headers, { getState }) => {
            const state = getState() as RootState;
            const { user, signature } = state.user;

            if (user?.walletAddress) {
                if (!signature) {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const message = process.env.NEXT_PUBLIC_SIGNATURE_MESSAGE || 'Sign this message to authenticate';
                    const newSignature = await signer.signMessage(message);
                    api.dispatch(setSignature(newSignature));
                    headers.set('Authorization', `Bearer ${newSignature}`);
                } else {
                    headers.set('Authorization', `Bearer ${signature}`);
                }
            }

            return headers;
        },
    })(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        api.dispatch(logOut());
        // You might want to redirect to login page or show a message here
    }

    if (result.error) {
        const errorData = result.error.data as ApiResponse<null>;
        console.error('API Error:', errorData);
        // You might want to show an error message to the user here
        return { error: result.error };
    }

    const successData = result.data as ApiResponse<unknown>;
    console.log('API Success:', successData);

    return { data: successData };
};

export const apiSlice = createApi({
    baseQuery: baseQuery,
    tagTypes: ['User', 'Pod'], // Add other tag types as needed
    endpoints: () => ({}),
});