import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { keys } from "lodash";
import { RootState } from './store';



const API_TAG_CONFIG = {
    User: {
        prefixes: ["userId"] as const,
    },
    Pod: {
        prefixes: ["podId"] as const,
    },
    Calls: {
        prefixes: ["callsId"] as const,
    },
    ScheduledCalls: {
        prefixes: ["scheduledCallsId"] as const,
    },
    CallStats: {
        prefixes: ["callStatsId"] as const,
    },
    DetailedCallStats: {
        prefixes: ["detailedCallStatsId"] as const,
    },
    UserCalls: {
        prefixes: ["userCallsId"] as const,
    },
    callDetails: {
        prefixes: ["callDetailsId"] as const,
    },
    Leaderboard: {
        prefixes: ["leaderboardId"] as const,
    }
} as const;

const getTagTypes = (): string[] => keys(API_TAG_CONFIG);

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

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 });

export const api = createApi({
    baseQuery: baseQueryWithRetry,
    tagTypes: getTagTypes(),
    endpoints: () => ({}),
});