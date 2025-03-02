import { api } from '../config/base';
import { createTag } from '../config/tags';
import { CALLS_ENDPOINTS } from './endpoints';
import {
    ApiResponse,
    CallStatsResponse,
    DetailedCallStatsResponse,
    LeaderboardResponse,
    QueryParams,
} from './types';

export const callAnalyticsApiSlice = api.injectEndpoints({
    endpoints: builder => ({
        listCallStats: builder.query<ApiResponse<CallStatsResponse>, QueryParams>({
            query: queryParams => ({
                url: CALLS_ENDPOINTS.listCallStats(queryParams),
                method: 'GET',
            }),
            providesTags: [createTag('CallStats'), createTag('CallDetails')],
        }),
        listDetailedCallStats: builder.query<ApiResponse<DetailedCallStatsResponse>, QueryParams>({
            query: queryParams => ({
                url: CALLS_ENDPOINTS.listDetailedCallStats(queryParams),
                method: 'GET',
            }),
            providesTags: [createTag('DetailedCallStats'), createTag('CallDetails')],
        }),
        listUserCalls: builder.query<ApiResponse<{ calls: any[] }>, void>({
            query: () => ({
                url: CALLS_ENDPOINTS.listUserCalls(),
                method: 'GET',
            }),
            providesTags: [createTag('UserCalls')],
        }),
        listCallDetails: builder.query<ApiResponse<{ calls: any[] }>, string>({
            query: callId => ({
                url: CALLS_ENDPOINTS.listCallDetails(callId),
                method: 'GET',
            }),
            providesTags: (_result, _error, callId) => [
                createTag({
                    id: callId,
                    prefix: 'callDetailsId',
                    type: 'CallDetails',
                }),
            ],
        }),
        listLeaderboard: builder.query<ApiResponse<{ data: LeaderboardResponse[] }>, QueryParams>({
            query: queryParams => ({
                url: CALLS_ENDPOINTS.listLeaderboard(queryParams),
                method: 'GET',
            }),
            providesTags: [createTag('Leaderboard')],
        }),
    }),
});

export const {
    useListCallStatsQuery,
    useListDetailedCallStatsQuery,
    useListUserCallsQuery,
    useListCallDetailsQuery,
    useListLeaderboardQuery,
} = callAnalyticsApiSlice;
