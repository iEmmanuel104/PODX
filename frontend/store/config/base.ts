import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError, retry } from "@reduxjs/toolkit/query/react";
import { RootState } from './store';
import { logOut, setSignature } from "../auth/slice";
import { ApiResponse } from "../callStats/types";

const API_TAG_CONFIG = {
    User: { prefixes: ["userId"] as const },
    Pod: { prefixes: ["podId"] as const },
    Calls: { prefixes: ["callsId"] as const },
    ScheduledCalls: { prefixes: ["scheduledCallsId"] as const },
    CallStats: { prefixes: ["callStatsId"] as const },
    DetailedCallStats: { prefixes: ["detailedCallStatsId"] as const },
    UserCalls: { prefixes: ["userCallsId"] as const },
    CallDetails: { prefixes: ["callDetailsId"] as const },
    Leaderboard: { prefixes: ["leaderboardId"] as const }
} as const;

// Use native Object.keys instead of lodash.keys
const getTagTypes = (): string[] => Object.keys(API_TAG_CONFIG);

export type TagType = keyof typeof API_TAG_CONFIG;
export type ApiTagConfig = typeof API_TAG_CONFIG;

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
    prepareHeaders: (headers, { getState }) => {
        const { user, signature } = (getState() as RootState).auth;

        if (user?.walletAddress && signature) {
            headers.set('Authorization', `Bearer ${signature}`);
        }

        return headers;
    }
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 and token expiration
    if (result.error?.status === 401 &&
        (result.error.data as ApiResponse<unknown>).message === 'Token expired') {
        const { user } = (api.getState() as RootState).auth;

        if (user?.walletAddress) {
            try {
                const body = new URLSearchParams();
                body.append('walletAddress', user.walletAddress);
                body.append('hash', 'true');

                const refreshResult = await fetchBaseQuery({
                    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
                })({
                    url: '/user/validate',
                    method: 'POST',
                    body,
                }, api, extraOptions);

                if (refreshResult.data) {
                    const refreshData = refreshResult.data as ApiResponse<{ signature: string }>;
                    api.dispatch(setSignature(refreshData.data!.signature));
                    return baseQuery(args, api, extraOptions);
                }

                api.dispatch(logOut());
            } catch {
                api.dispatch(logOut());
            }
        } else {
            api.dispatch(logOut());
        }
    }

    // Handle errors and logging
    if (result.error) {
        const errorData = result.error.data as ApiResponse<null>;
        console.error('API Error:', errorData);
        return { error: result.error };
    }

    const successData = result.data as ApiResponse<unknown>;
    return { data: successData };
};

// Configure retry with backoff
const baseQueryWithRetry = retry(baseQueryWithReauth, {
    maxRetries: 3,
    backoff: (attempt) => new Promise((resolve) => setTimeout(resolve, Math.min(1000 * (2 ** attempt), 30000)))
});

export const api = createApi({
    baseQuery: baseQueryWithRetry,
    tagTypes: getTagTypes(),
    endpoints: () => ({}),
});