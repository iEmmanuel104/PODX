// hooks/useScheduledCalls.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    useScheduleCallMutation,
    useGetScheduledCallQuery,
    useGetUserScheduledCallsQuery,
    ScheduleCallArgs
} from '@/store/api/scheduledCallsApi';
import {
    setScheduledSessions,
    addScheduledSession,
    clearScheduledSessions
} from '@/store/slices/scheduledSessionSlice';
import type { StreamCallData } from '@/components/pod/StreamCallData';
import type { ApiResponse } from '@/store/api/api';
import { MutationTrigger } from '@reduxjs/toolkit/dist/query/react/buildHooks';
import { MutationDefinition } from '@reduxjs/toolkit/query';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: MutationTrigger<MutationDefinition<ScheduleCallArgs, any, any, ApiResponse<StreamCallData>>>;
    isLoading: boolean;
    getScheduledCall: (sessionId: string) => Promise<ApiResponse<{ call: StreamCallData }>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useAppSelector((state) => state.scheduledSessions.sessions);
    const [scheduleCallMutation] = useScheduleCallMutation();
    const { data: userScheduledCalls, isLoading } = useGetUserScheduledCallsQuery();

    useEffect(() => {
        if (userScheduledCalls?.data?.calls) {
            dispatch(setScheduledSessions(userScheduledCalls.data.calls));
        }
    }, [userScheduledCalls, dispatch]);

    const getScheduledCall = async (sessionId: string): Promise<ApiResponse<{ call: StreamCallData }>> => {
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
        scheduleCall: scheduleCallMutation,
        isLoading,
        getScheduledCall,
    };
};
