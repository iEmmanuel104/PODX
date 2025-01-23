// src/store/api/callAnalyticsApi.ts
import { ApiResponse, apiSlice } from './api';

// Types for call statistics
export interface CallStats {
    totalCalls: number;
    ongoingCalls: number;
    completedCalls: number;
    upcomingCalls: number;
    callsByType: { [key: string]: number };
    callsByDate: { [key: string]: number };
}

export interface PaginatedCalls {
    all: any[];
    ongoing: any[];
    upcoming: any[];
    completed: any[];
}

export interface CallStatsPagination {
    next?: string;
    hasMore: boolean;
    page: number;
    size: number;
    total: number;
}

export interface CallStatsResponse {
    stats: CallStats;
    calls: PaginatedCalls;
    pagination: CallStatsPagination;
}

// Types for detailed analytics
export interface CallStatsReport {
    call_cid: string;
    call_session_id: string;
    first_stats_time: Date;
    call_status: string;
    quality_score?: number;
    created_at?: Date;
    call_duration_seconds: number;
}

export interface CallStatsAnalytics {
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    averageQualityScore: number;
    callsByStatus: {
        [key: string]: number;
    };
    callsByDuration: {
        short: number; // < 5 minutes
        medium: number; // 5-15 minutes
        long: number; // > 15 minutes
    };
    qualityScoreRanges: {
        excellent: number; // 90-100
        good: number; // 70-89
        fair: number; // 50-69
        poor: number; // < 50
    };
    timeDistribution: {
        [key: string]: number;
    };
}

export interface DetailedCallStatsResponse {
    analytics: CallStatsAnalytics;
    reports: CallStatsReport[];
    pagination: {
        next?: string;
        prev?: string;
        hasMore: boolean;
        total: number;
    };
    duration: string;
}

export interface LeaderboardResponse {
    userId: string;
    username: string;
    displayImage?: string;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
}

export interface GetLeaderboardParams {
    limit?: number;
}
// Query parameter types
export interface GetCallStatsParams {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    next?: string;
}

export interface GetDetailedStatsParams {
    startDate?: string;
    endDate?: string;
    size?: number;
    next?: string;
}

// API Slice
export const callAnalyticsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        // Get basic call statistics
        getCallStats: builder.query<ApiResponse<CallStatsResponse>, GetCallStatsParams>({
            query: params => {
                const queryParams = new URLSearchParams();
                if (params.startDate) queryParams.append('startDate', params.startDate);
                if (params.endDate) queryParams.append('endDate', params.endDate);
                if (params.page) queryParams.append('page', params.page.toString());
                if (params.size) queryParams.append('size', params.size.toString());
                if (params.next) queryParams.append('next', params.next);

                return {
                    url: `/calls/stats?${queryParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['CallStats', 'CallDetails'],
        }),

        // Get detailed call statistics
        getDetailedCallStats: builder.query<
            ApiResponse<DetailedCallStatsResponse>,
            GetDetailedStatsParams
        >({
            query: params => {
                const queryParams = new URLSearchParams();
                if (params.startDate) queryParams.append('startDate', params.startDate);
                if (params.endDate) queryParams.append('endDate', params.endDate);
                if (params.size) queryParams.append('size', params.size.toString());
                if (params.next) queryParams.append('next', params.next);

                return {
                    url: `/calls/detailed-stats?${queryParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['DetailedCallStats', 'CallDetails'],
        }),

        // Get user's call history
        getUserCalls: builder.query<ApiResponse<{ calls: any[] }>, void>({
            query: () => ({
                url: '/calls/user-calls',
                method: 'GET',
            }),
            providesTags: ['UserCalls'],
        }),

        // Get specific call details
        getCallDetails: builder.query<ApiResponse<{ call: any }>, string>({
            query: callId => ({
                url: `/calls/${callId}`,
                method: 'GET',
            }),
            providesTags: (result, error, callId) => [{ type: 'CallDetails', id: callId }],
        }),

        // Get leaderboard
        getLeaderboard: builder.query<
            ApiResponse<{ data: LeaderboardResponse[] }>,
            GetLeaderboardParams
        >({
            query: params => {
                const queryParams = new URLSearchParams();
                if (params.limit) queryParams.append('limit', params.limit.toString());

                return {
                    url: `/leaderboard?${queryParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Leaderboard'],
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetCallStatsQuery,
    useGetDetailedCallStatsQuery,
    useGetUserCallsQuery,
    useGetCallDetailsQuery,
    useGetLeaderboardQuery,
    // Prefetch actions
    usePrefetch,
} = callAnalyticsApiSlice;
