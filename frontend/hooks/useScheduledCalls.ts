import { useEffect, useCallback, useState, } from 'react';
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
import { clearScheduledSessions, setScheduledSessions, removeScheduledSession } from '@/store/scheduleSession/slice';

interface UseScheduledCallsReturn {
    scheduledSessions: StreamCallData[];
    scheduleCall: (args: ScheduleCallArgs) => Promise<{ data: ApiResponse<StreamCallData> }>;
    deleteCall: (sessionId: string) => Promise<{ success: boolean; message: string }>;
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
    const [forceLoading, setForceLoading] = useState(true);

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
        console.debug('Manually refetching scheduled sessions...');
        refetchScheduledCalls();
    }, [refetchScheduledCalls]);

    // Manual refresh that forces a new API call and updates redux state
    const refreshSessions = useCallback(async (): Promise<void> => {
        console.debug('Refreshing scheduled sessions with direct API call...');
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
                console.debug('Scheduled sessions refreshed successfully with', validSessions.length, 'valid sessions');
            }
        } catch (error) {
            console.error('Failed to refresh sessions:', error);
        }
    }, [dispatch]);

    // Update local state when user scheduled calls change
    useEffect(() => {
        console.debug("[useScheduledCalls] userScheduledCalls data received:", userScheduledCalls);

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
                    console.debug(`Filtering out expired session: ${session.id}`);
                    return false;
                }
                
                return true;
            });
            
            console.debug(`Filtered ${userScheduledCalls.data.calls.length - validSessions.length} invalid/expired sessions`);
            dispatch(setScheduledSessions(validSessions));
        }
    }, [userScheduledCalls, dispatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.debug("[useScheduledCalls] Cleaning up scheduled sessions");
            dispatch(clearScheduledSessions());
        };
    }, [dispatch]);

    // Ensure we exit loading state if we have data but loading flags are stuck
    useEffect(() => {
        if (scheduledSessions.length > 0 && forceLoading) {
            const timer = setTimeout(() => {
                console.debug("[useScheduledCalls] Data available but still loading, forcing exit from loading state");
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
            console.debug(`[useScheduledCalls] Retrieving call with ID: ${sessionId}`);
            const result = await dispatch(
                scheduledCallsApiSlice.endpoints.retrieveCall.initiate(sessionId)
            );

            if ('error' in result) {
                console.error(`[useScheduledCalls] Error retrieving call: ${result.error}`);
                throw new Error('Failed to fetch call');
            }

            console.debug(`[useScheduledCalls] Call retrieval result:`, result.data);
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
            console.debug(`[useScheduledCalls] Deleting call with ID: ${sessionId}`);
            // const result = await deleteCallMutation({ callId: sessionId });
            const result = await deleteCallMutation(sessionId);

            if ('error' in result) {
                console.error(`[useScheduledCalls] Error deleting call: ${result.error}`);
                throw new Error('Failed to delete call');
            }

            // Remove from local state
            console.debug(`[useScheduledCalls] Removing deleted call from Redux store`);
            dispatch(removeScheduledSession(sessionId));

            return { success: true, message: 'Session has been canceled' };
        } catch (error) {
            console.error('Failed to delete call:', error);
            return { success: false, message: 'Failed to cancel the session' };
        }
    };

    // Delete a scheduled call
    const deleteScheduledCall = async (sessionId: string): Promise<boolean> => {
        try {
            console.debug(`Attempting to delete session: ${sessionId}`);
            const result = await deleteCallMutation(sessionId);
            console.debug('Delete call response:', result);
            
            if ('error' in result) {
                // If the error is 404 Not Found, we consider it successful
                // because the session is already gone from Redis
                if (result.error && 'status' in result.error && result.error.status === 404) {
                    console.debug('Session not found in Redis, considering deletion successful');
                    // Force refresh to make sure UI is updated
                    await refreshSessions();
                    return true;
                }
                console.error('Error in delete mutation response:', result.error);
                throw result.error;
            }
            
            // Check the API response for success
            if (result.data?.status === 'success') {
                console.debug('Session deleted successfully on the server');
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
        deleteCall,
        deleteScheduledCall,
        isLoading: isLoadingCalls || isScheduling || isDeleting,
        retrieveCall,
        refreshSessions,
        refetchSessions,
        getOrCreateCall
    };
};
