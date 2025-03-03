import { useEffect, useCallback } from 'react';
import type { StreamCallData } from '@/components/pod/streamCallData';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import {
    GetCallResponse,
    scheduledCallsApiSlice,
    useListUserScheduledCallsQuery,
    useScheduleCallMutation,
    useDeleteScheduledCallMutation,
    GetOrCreateCallArgs
} from '@/store/callStats/scheduledCallsApiSlice';
import { ApiResponse, ScheduleCallArgs } from '@/store/callStats/types';
import { clearScheduledSessions, setScheduledSessions } from '@/store/scheduleSession/slice';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    deleteScheduledCall: (sessionId: string) => Promise<boolean>;
    isLoading: boolean;
    retrieveCall: (sessionId: string) => Promise<ApiResponse<GetCallResponse | null>>;
    refreshSessions: () => Promise<void>;
    refetchSessions: () => void;
    getOrCreateCall: (args: GetOrCreateCallArgs) => Promise<ApiResponse<{ call: StreamCallData }>>;
}

export const useScheduledCalls = (): UseScheduledCallsReturn => {
    const dispatch = useAppDispatch();
    const scheduledSessions = useTypedSelector(state => state.scheduleSession.sessions);

    // RTK Query hooks
    const [scheduleCallMutation, { isLoading: isScheduling }] = useScheduleCallMutation();
    const [deleteCallMutation, { isLoading: isDeleting }] = useDeleteScheduledCallMutation();
    const { 
        data: userScheduledCalls, 
        isLoading: isLoadingCalls,
        refetch: refetchScheduledCalls
    } = useListUserScheduledCallsQuery(undefined, {
        // Poll every 30 seconds and re-fetch on window focus
        pollingInterval: 30000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    });

    // Simple function to trigger a refetch
    const refetchSessions = useCallback(() => {
        console.log('Manually refetching scheduled sessions...');
        refetchScheduledCalls();
    }, [refetchScheduledCalls]);

    // Manual refresh that forces a new API call and updates redux state
    const refreshSessions = useCallback(async (): Promise<void> => {
        console.log('Refreshing scheduled sessions with direct API call...');
        try {
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.listUserScheduledCalls.initiate(undefined, {
                    forceRefetch: true
                })
            );
            
            if ('data' in result && result.data?.data?.calls) {
                // Apply the same filtering logic as the useEffect
                const validSessions = result.data.data.calls.filter(session => {
                    if (!session || !session.id || !session.starts_at || !session.created_by) {
                        return false;
                    }
                    
                    const startTime = new Date(session.starts_at);
                    const now = new Date();
                    const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000);
                    
                    if (now > expiryTime) {
                        return false;
                    }
                    
                    return true;
                });
                
                // Update Redux state directly
                dispatch(setScheduledSessions(validSessions));
                console.log('Scheduled sessions refreshed successfully with', validSessions.length, 'valid sessions');
            }
        } catch (error) {
            console.error('Failed to refresh sessions:', error);
        }
    }, [dispatch]);

    // Update local state when user scheduled calls change
    useEffect(() => {
        if (userScheduledCalls?.data?.calls) {
            // Filter out any invalid sessions (those without required fields)
            const validSessions = userScheduledCalls.data.calls.filter(session => {
                // Check if the session has all required fields
                if (!session || !session.id || !session.starts_at || !session.created_by) {
                    console.warn('Filtering out invalid session:', session);
                    return false;
                }
                
                // Filter out expired sessions (older than 5 minutes from start time)
                const startTime = new Date(session.starts_at);
                const now = new Date();
                const expiryTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes after start
                
                if (now > expiryTime) {
                    console.log(`Filtering out expired session: ${session.id}`);
                    return false;
                }
                
                return true;
            });
            
            console.log(`Filtered ${userScheduledCalls.data.calls.length - validSessions.length} invalid/expired sessions`);
            dispatch(setScheduledSessions(validSessions));
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

    // Delete a scheduled call
    const deleteScheduledCall = async (sessionId: string): Promise<boolean> => {
        try {
            console.log(`Attempting to delete session: ${sessionId}`);
            const result = await deleteCallMutation(sessionId);
            console.log('Delete call response:', result);
            
            if ('error' in result) {
                // If the error is 404 Not Found, we consider it successful
                // because the session is already gone from Redis
                if (result.error && 'status' in result.error && result.error.status === 404) {
                    console.log('Session not found in Redis, considering deletion successful');
                    // Force refresh to make sure UI is updated
                    await refreshSessions();
                    return true;
                }
                console.error('Error in delete mutation response:', result.error);
                throw result.error;
            }
            
            // Check the API response for success
            if (result.data?.status === 'success') {
                console.log('Session deleted successfully on the server');
                // Force refresh to make sure UI is updated
                await refreshSessions();
                return true;
            } else {
                console.warn('Server returned an unsuccessful status:', result.data);
                return false;
            }
        } catch (error) {
            console.error('Failed to delete scheduled call:', error);
            throw error;
        }
    };

    // Schedule a call with immediate refresh
    const scheduleCall = async (args: ScheduleCallArgs) => {
        const result = await scheduleCallMutation(args);
        if ('error' in result) {
            throw result.error;
        }
        
        // Force refresh to make sure UI is updated with the new session
        await refreshSessions();
        
        return { data: result.data as ApiResponse<StreamCallData> };
    };

    // Get or create a call
    const getOrCreateCall = async (args: GetOrCreateCallArgs) => {
        const result = await dispatch(
            scheduledCallsApiSlice.endpoints.getOrCreateCall.initiate(args)
        );

        if ('error' in result) {
            throw result.error;
        }

        return result.data as ApiResponse<{ call: StreamCallData }>;
    };

    return {
        scheduledSessions,
        scheduleCall,
        deleteScheduledCall,
        isLoading: isLoadingCalls || isScheduling || isDeleting,
        retrieveCall,
        refreshSessions,
        refetchSessions,
        getOrCreateCall
    };
};
