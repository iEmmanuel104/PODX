import { api } from '../config/base';
import { StreamCallData } from '@/components/pod/streamCallData';
import { ApiResponse, ScheduleCallArgs } from './types';
import { CALLS_ENDPOINTS } from './endpoints';
import { createTag } from '../config/tags';

export interface GetCallResponse {
    call: StreamCallData;
    source: 'stream' | 'scheduled';
    hasJoined: boolean;
    participants: number;
}

export interface GetUserScheduledCallsResponse {
    calls: StreamCallData[];
}

// Interface for get-or-create call arguments
export interface GetOrCreateCallArgs {
    callType: string;
    callId: string;
    members?: Array<{ user_id: string }>;
    settings?: any;
}

export const scheduledCallsApiSlice = api.injectEndpoints({
    endpoints: builder => ({
        scheduleCall: builder.mutation<ApiResponse<StreamCallData>, ScheduleCallArgs>({
            query: payload => ({
                body: payload,
                method: 'POST',
                url: CALLS_ENDPOINTS.scheduleCall(),
            }),
            invalidatesTags: [createTag('ScheduledCalls')],
        }),

        deleteScheduledCall: builder.mutation<ApiResponse<{status: string; message: string}>, string>({
            query: sessionId => ({
                method: 'DELETE',
                url: CALLS_ENDPOINTS.deleteScheduledCall(sessionId),
            }),
            invalidatesTags: [createTag('ScheduledCalls')],
        }),

        getOrCreateCall: builder.mutation<ApiResponse<{ call: StreamCallData }>, GetOrCreateCallArgs>({
            query: payload => ({
                body: payload,
                method: 'POST',
                url: CALLS_ENDPOINTS.getOrCreateCall(),
            }),
        }),

        retrieveCall: builder.query<ApiResponse<GetCallResponse | null>, string>({
            query: sessionId => ({
                method: 'GET',
                url: CALLS_ENDPOINTS.retrieveCall(sessionId),
            }),
            providesTags: (_result, _error, sessionId) => [
                createTag({
                    id: sessionId,
                    prefix: 'callsId',
                    type: 'Calls',
                }),
            ],
        }),

        listUserScheduledCalls: builder.query<ApiResponse<GetUserScheduledCallsResponse>, void>({
            query: () => ({
                method: 'GET',
                url: CALLS_ENDPOINTS.listUserScheduledCalls(),
            }),
            providesTags: [createTag('ScheduledCalls')],
        }),
    }),
});

export const {
    useRetrieveCallQuery,
    useListUserScheduledCallsQuery,
    useScheduleCallMutation,
    useDeleteScheduledCallMutation,
    useGetOrCreateCallMutation,
} = scheduledCallsApiSlice;
