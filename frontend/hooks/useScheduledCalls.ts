// hooks/useScheduledCalls.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    useScheduleCallMutation,
    useGetScheduledCallQuery,
    useGetUserScheduledCallsQuery,
} from '@/store/api/scheduledCallsApi';
import {
    setScheduledSessions,
    addScheduledSession,
    clearScheduledSessions,
} from '@/store/slices/scheduledSessionSlice';
import type { StreamCallData } from "@/components/pod/StreamCallData";
import type { ApiResponse } from '@/store/api/api';

interface ScheduleCallParams {
    title: string;
    type: string;
    sessionId: string;
    starts_at: string;
}

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (params: ScheduleCallParams) => Promise<ApiResponse<StreamCallData>>;
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

    const handleScheduleCall = async (callData: ScheduleCallParams): Promise<ApiResponse<StreamCallData>> => {
        try {
            const response = await scheduleCallMutation(callData).unwrap();
            if (response.data) {
                dispatch(addScheduledSession(response.data));
            }
            return response;
        } catch (error) {
            console.error('Failed to schedule call:', error);
            throw error;
        }
    };

    const getScheduledCall = async (sessionId: string): Promise<ApiResponse<{ call: StreamCallData }>> => {
        try {
            return await fetch(`/api/calls/scheduled/${sessionId}`).then(res => res.json());
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
        scheduleCall: handleScheduleCall,
        isLoading,
        getScheduledCall,
    };
};
