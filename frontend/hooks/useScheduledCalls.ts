// hooks/useScheduledCalls.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    useScheduleCallMutation,
    useGetUserScheduledCallsQuery,
    scheduledCallsApiSlice
} from '@/store/api/scheduledCallsApi';
import {
    setScheduledSessions,
    clearScheduledSessions
} from '@/store/slices/scheduledSessionSlice';
import type { StreamCallData } from '@/components/pod/streamCallData';
import type { ApiResponse } from '@/store/api/api';
import type { ScheduleCallArgs, GetScheduledCallResponse } from '@/store/api/scheduledCallsApi';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    isLoading: boolean;
    getScheduledCall: (sessionId: string) => Promise<ApiResponse<GetScheduledCallResponse>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useAppSelector((state) => state.scheduledSessions.sessions);

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

    // Get a single scheduled call using RTK Query
    const getScheduledCall = async (sessionId: string): Promise<ApiResponse<GetScheduledCallResponse>> => {
        try {
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.getScheduledCall.initiate(sessionId)
            );

            if ('error' in result) {
                throw new Error('Failed to fetch scheduled call');
            }

            if (!result.data) {
                throw new Error('No data returned for scheduled call');
            }
            return result.data;
        } catch (error) {
            console.error('Failed to get scheduled call:', error);
            throw error;
        }
    };

    // Schedule a new call
    const scheduleCall = async (args: ScheduleCallArgs) => {
        try {
            const result = await scheduleCallMutation(args);

            if ('error' in result) {
                throw result.error;
            }

            return { data: result.data as ApiResponse<StreamCallData> };
        } catch (error) {
            console.error('Failed to schedule call:', error);
            throw error;
        }
    };

    return {
        scheduledSessions,
        scheduleCall,
        isLoading: isLoadingCalls || isScheduling,
        getScheduledCall,
    };
};