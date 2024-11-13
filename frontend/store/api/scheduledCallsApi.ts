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
    hasJoined: boolean;
    participants: number;
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
        getScheduledCall: builder.query<ApiResponse<GetScheduledCallResponse | null>, string>({
            query: (sessionId) => ({
                url: `/calls/scheduled/${sessionId}`,
                method: 'GET',
            }),
            providesTags: (result, error, sessionId) => [
                { type: 'ScheduledCalls', id: sessionId }
            ],
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

export const {
    useScheduleCallMutation,
    useGetScheduledCallQuery,
    useGetUserScheduledCallsQuery,
} = scheduledCallsApiSlice;