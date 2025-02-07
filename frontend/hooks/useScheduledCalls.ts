// hooks/useScheduledCalls.ts
import { useEffect } from 'react';
import {
    useScheduleCallMutation,
    useGetUserScheduledCallsQuery,
    scheduledCallsApiSlice,
} from '@/store/api/scheduledCallsApi';
import { setScheduledSessions, clearScheduledSessions } from '@/store/slices/scheduledSessionSlice';
import type { StreamCallData } from '@/components/pod/streamCallData';
import type { ApiResponse } from '@/store/api/api';
import type { ScheduleCallArgs, GetCallResponse } from '@/store/api/scheduledCallsApi';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    isLoading: boolean;
    getCall: (sessionId: string) => Promise<ApiResponse<GetCallResponse | null>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useTypedSelector(state => state.scheduleSession.sessions);

    // RTK Query hooks
    const [scheduleCallMutation, { isLoading: isScheduling }] = useScheduleCallMutation();
    const { data: userScheduledCalls, isLoading: isLoadingCalls } = useGetUserScheduledCallsQuery();

    // Update local state when user scheduled calls change
    useEffect(() => {
        if (userScheduledCalls?.data?.calls) {
            dispatch(setScheduledSessions(userScheduledCalls.data.calls));
        }
    }, [userScheduledCalls, dispatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(clearScheduledSessions());
        };
    }, [dispatch]);

    // Get a call using RTK Query (checks both stream and scheduled calls)
    const getCall = async (
        sessionId: string
    ): Promise<ApiResponse<GetCallResponse | null>> => {
        try {
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.getCall.initiate(sessionId)
            );

            if ('error' in result) {
                throw new Error('Failed to fetch call');
            }

            return result.data as ApiResponse<GetCallResponse | null>;
        } catch (error) {
            console.error('Failed to get call:', error);
            throw error;
        }
    };

    return {
        scheduledSessions,
        scheduleCall: async (args: ScheduleCallArgs) => {
            const result = await scheduleCallMutation(args);
            if ('error' in result) {
                throw result.error;
            }
            return { data: result.data as ApiResponse<StreamCallData> };
        },
        isLoading: isLoadingCalls || isScheduling,
        getCall,
    };
};