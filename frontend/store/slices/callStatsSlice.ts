import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CallStats, CallStatsAnalytics, CallStatsReport } from '../api/callAnalyticsApi';

export interface CallStatsState {
    basicStats: CallStats | null;
    detailedAnalytics: CallStatsAnalytics | null;
    reports: CallStatsReport[];
    timeRange: {
        startDate: string | null;
        endDate: string | null;
    };
    loading: boolean;
    error: string | null;
}

const initialState: CallStatsState = {
    basicStats: null,
    detailedAnalytics: null,
    reports: [],
    timeRange: {
        startDate: null,
        endDate: null,
    },
    loading: false,
    error: null,
};

const callStatsSlice = createSlice({
    name: 'callStats',
    initialState,
    reducers: {
        setBasicStats: (state, action: PayloadAction<CallStats>) => {
            state.basicStats = action.payload;
            state.error = null;
        },
        setDetailedAnalytics: (state, action: PayloadAction<CallStatsAnalytics>) => {
            state.detailedAnalytics = action.payload;
            state.error = null;
        },
        setReports: (state, action: PayloadAction<CallStatsReport[]>) => {
            state.reports = action.payload;
            state.error = null;
        },
        setTimeRange: (
            state,
            action: PayloadAction<{ startDate: string | null; endDate: string | null }>
        ) => {
            state.timeRange = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
        clearStats: state => {
            state.basicStats = null;
            state.detailedAnalytics = null;
            state.reports = [];
            state.error = null;
        },
    },
});

export const {
    setBasicStats,
    setDetailedAnalytics,
    setReports,
    setTimeRange,
    setLoading,
    setError,
    clearStats,
} = callStatsSlice.actions;

export default callStatsSlice.reducer;
