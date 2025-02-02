// store/api/scheduledCallsApi.ts
import { ApiResponse, apiSlice } from './api';
import { StreamCallData } from '@/components/pod/streamCallData';

export interface ScheduleCallArgs {
    title: string;
    type: string;
    sessionId: string;
    starts_at: string;
}

export interface GetUserScheduledCallsResponse {
    calls: StreamCallData[];
}

export interface GetCallResponse {
    call: StreamCallData;
    source: 'stream' | 'scheduled';
    hasJoined: boolean;
    participants: number;
}

export const scheduledCallsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        scheduleCall: builder.mutation<ApiResponse<StreamCallData>, ScheduleCallArgs>({
            query: callData => ({
                url: '/calls/schedule',
                method: 'POST',
                body: callData,
            }),
            invalidatesTags: ['ScheduledCalls'],
        }),
        getCall: builder.query<ApiResponse<GetCallResponse | null>, string>({
            query: sessionId => ({
                url: `/calls/${sessionId}`,
                method: 'GET',
            }),
            providesTags: (result, error, sessionId) => [{ type: 'Calls', id: sessionId }],
        }),
        getUserScheduledCalls: builder.query<ApiResponse<GetUserScheduledCallsResponse>, void>({
            query: () => ({
                url: '/calls/scheduled',
                method: 'GET',
            }),
            providesTags: ['ScheduledCalls'],
        }),
    }),
});

export const { useScheduleCallMutation, useGetCallQuery, useGetUserScheduledCallsQuery } =
    scheduledCallsApiSlice;
