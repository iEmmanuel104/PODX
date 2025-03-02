import { useEffect, useState } from 'react';
import type { StreamCallData } from '@/components/pod/streamCallData';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import {
    GetCallResponse,
    scheduledCallsApiSlice,
    useListUserScheduledCallsQuery,
    useScheduleCallMutation,
    useDeleteScheduledCallMutation,
} from '@/store/callStats/scheduledCallsApiSlice';
import { ApiResponse, ScheduleCallArgs } from '@/store/callStats/types';
import { clearScheduledSessions, setScheduledSessions, removeScheduledSession } from '@/store/scheduleSession/slice';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    deleteCall: (sessionId: string) => Promise<{ success: boolean; message: string }>;
    isLoading: boolean;
    retrieveCall: (sessionId: string) => Promise<ApiResponse<GetCallResponse | null>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useTypedSelector(state => state.scheduleSession.sessions);
    const [forceLoading, setForceLoading] = useState(true);

    // RTK Query hooks
    const [scheduleCallMutation, { isLoading: isScheduling }] = useScheduleCallMutation();
    const [deleteCallMutation, { isLoading: isDeleting }] = useDeleteScheduledCallMutation();
    const { data: userScheduledCalls, isLoading: isLoadingCalls } =
        useListUserScheduledCallsQuery();

    // Update local state when user scheduled calls change
    useEffect(() => {
        console.log("[useScheduledCalls] userScheduledCalls data received:", userScheduledCalls);

        if (userScheduledCalls?.data?.calls) {
            console.log("[useScheduledCalls] Setting scheduled sessions in Redux store:",
                userScheduledCalls.data.calls);
            dispatch(setScheduledSessions(userScheduledCalls.data.calls));

            // Ensure we exit loading state after data is loaded
            if (forceLoading) {
                setTimeout(() => {
                    console.log("[useScheduledCalls] Forcing exit from loading state");
                    setForceLoading(false);
                }, 300);
            }
        } else {
            console.log("[useScheduledCalls] No scheduled calls data available or empty calls array");
        }
    }, [userScheduledCalls, dispatch, forceLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log("[useScheduledCalls] Cleaning up scheduled sessions");
            dispatch(clearScheduledSessions());
        };
    }, [dispatch]);

    // Ensure we exit loading state if we have data but loading flags are stuck
    useEffect(() => {
        if (scheduledSessions.length > 0 && forceLoading) {
            const timer = setTimeout(() => {
                console.log("[useScheduledCalls] Data available but still loading, forcing exit from loading state");
                setForceLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [scheduledSessions, forceLoading]);

    // Get a call using RTK Query (checks both stream and scheduled calls)
    const retrieveCall = async (
        sessionId: string
    ): Promise<ApiResponse<GetCallResponse | null>> => {
        try {
            console.log(`[useScheduledCalls] Retrieving call with ID: ${sessionId}`);
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.retrieveCall.initiate(sessionId)
            );

            if ('error' in result) {
                console.error(`[useScheduledCalls] Error retrieving call: ${result.error}`);
                throw new Error('Failed to fetch call');
            }

            console.log(`[useScheduledCalls] Call retrieval result:`, result.data);
            return result.data as ApiResponse<GetCallResponse | null>;
        } catch (error) {
            console.error('Failed to get call:', error);
            throw error;
        }
    };

    // Delete a scheduled call
    const deleteCall = async (
        sessionId: string
    ): Promise<{ success: boolean; message: string }> => {
        try {
            console.log(`[useScheduledCalls] Deleting call with ID: ${sessionId}`);
            const result = await deleteCallMutation({ callId: sessionId });

            if ('error' in result) {
                console.error(`[useScheduledCalls] Error deleting call: ${result.error}`);
                throw new Error('Failed to delete call');
            }

            // Remove from local state
            console.log(`[useScheduledCalls] Removing deleted call from Redux store`);
            dispatch(removeScheduledSession(sessionId));

            return { success: true, message: 'Session has been canceled' };
        } catch (error) {
            console.error('Failed to delete call:', error);
            return { success: false, message: 'Failed to cancel the session' };
        }
    };

    return {
        scheduledSessions,
        scheduleCall: async (args: ScheduleCallArgs) => {
            console.log(`[useScheduledCalls] Scheduling call with ID: ${args.sessionId}`, args);
            // Ensure we show loading while scheduling a new call
            setForceLoading(true);
            const result = await scheduleCallMutation(args);
            if ('error' in result) {
                console.error(`[useScheduledCalls] Error scheduling call: ${result.error}`);
                throw result.error;
            }
            console.log(`[useScheduledCalls] Call scheduled successfully:`, result.data);
            return { data: result.data as ApiResponse<StreamCallData> };
        },
        deleteCall,
        // Use our custom loading state alongside the RTK Query states
        isLoading: (isLoadingCalls || isScheduling || isDeleting || forceLoading) && scheduledSessions.length === 0,
        retrieveCall,
    };
};
