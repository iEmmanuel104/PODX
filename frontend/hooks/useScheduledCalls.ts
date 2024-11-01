// hooks/useScheduledCalls.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    useScheduleCallMutation,
    useGetScheduledCallQuery,
    useGetUserScheduledCallsQuery,
    ScheduleCallArgs,
    GetScheduledCallResponse
} from '@/store/api/scheduledCallsApi';
import {
    setScheduledSessions,
    clearScheduledSessions
} from '@/store/slices/scheduledSessionSlice';
import type { StreamCallData } from '@/components/pod/streamCallData';
import type { ApiResponse } from '@/store/api/api';
import { BaseQueryFn, MutationDefinition } from '@reduxjs/toolkit/query';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    isLoading: boolean;
    getScheduledCall: (sessionId: string) => Promise<ApiResponse<GetScheduledCallResponse>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useAppSelector((state) => state.scheduledSessions.sessions);
    const [scheduleCallMutation, { isLoading: isScheduling }] = useScheduleCallMutation();
    const { data: userScheduledCalls, isLoading: isLoadingCalls } = useGetUserScheduledCallsQuery();

    useEffect(() => {
        if (userScheduledCalls?.data?.calls) {
            dispatch(setScheduledSessions(userScheduledCalls.data.calls));
        }
    }, [userScheduledCalls, dispatch]);

    const getScheduledCall = async (sessionId: string): Promise<ApiResponse<GetScheduledCallResponse>> => {
        try {
            const response = await fetch(`/api/calls/scheduled/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch scheduled call');
            }
            return response.json();
        } catch (error) {
            console.error('Failed to get scheduled call:', error);
            throw error;
        }
    };

    useEffect(() => {
        return () => {
            dispatch(clearScheduledSessions());
        };
    }, [dispatch]);

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
        getScheduledCall,
    };
};
