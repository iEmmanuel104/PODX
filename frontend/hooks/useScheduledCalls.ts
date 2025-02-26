import { useEffect } from 'react';
import type { StreamCallData } from '@/components/pod/streamCallData';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import {
    GetCallResponse,
    scheduledCallsApiSlice,
    useListUserScheduledCallsQuery,
    useScheduleCallMutation,
} from '@/store/callStats/scheduledCallsApiSlice';
import { ApiResponse, ScheduleCallArgs } from '@/store/callStats/types';
import { clearScheduledSessions, setScheduledSessions } from '@/store/scheduleSession/slice';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    isLoading: boolean;
    retrieveCall: (sessionId: string) => Promise<ApiResponse<GetCallResponse | null>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useTypedSelector(state => state.scheduleSession.sessions);

    // RTK Query hooks
    const [scheduleCallMutation, { isLoading: isScheduling }] = useScheduleCallMutation();
    const { data: userScheduledCalls, isLoading: isLoadingCalls } =
        useListUserScheduledCallsQuery();

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
    const retrieveCall = async (
        sessionId: string
    ): Promise<ApiResponse<GetCallResponse | null>> => {
        try {
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.retrieveCall.initiate(sessionId)
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
        retrieveCall,
    };
};
