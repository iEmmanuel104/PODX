// store/api/scheduledCallsApi.ts
import { ApiResponse, apiSlice } from './api';
import { StreamCallData } from '@/components/pod/streamCallData';

export interface ScheduleCallArgs {
    title: string;
    type: string;
    sessionId: string;
    starts_at: string;
}

export interface GetScheduledCallResponse {
    call: StreamCallData;
}

export interface GetUserScheduledCallsResponse {
    calls: StreamCallData[];
}

export const scheduledCallsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        scheduleCall: builder.mutation<ApiResponse<StreamCallData>, ScheduleCallArgs>({
            query: (callData) => ({
                url: '/calls/schedule',
                method: 'POST',
                body: callData,
            }),
            invalidatesTags: ['ScheduledCalls'],
        }),
        getScheduledCall: builder.query<ApiResponse<GetScheduledCallResponse>, string>({
            query: (sessionId) => ({
                url: `/calls/scheduled/${sessionId}`,
                method: 'GET',
            }),
            providesTags: ['ScheduledCalls'],
            keepUnusedDataFor: 30, // Keep unused data for 30 seconds
        }),
        getUserScheduledCalls: builder.query<ApiResponse<GetUserScheduledCallsResponse>, void>({
            query: () => ({
                url: '/calls/scheduled',
                method: 'GET',
            }),
            providesTags: ['ScheduledCalls'],
            keepUnusedDataFor: 60, // Keep unused data for 60 seconds
        }),
    }),
});

export const {
    useScheduleCallMutation,
    useGetScheduledCallQuery,
    useGetUserScheduledCallsQuery,
} = scheduledCallsApiSlice;