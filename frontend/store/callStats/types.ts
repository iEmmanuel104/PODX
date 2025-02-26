export interface CallStats {
    totalCalls: number;
    ongoingCalls: number;
    completedCalls: number;
    upcomingCalls: number;
    callsByType: { [key: string]: number };
    callsByDate: { [key: string]: number };
}

export interface PaginatedCalls {
    all: any[];
    ongoing: any[];
    upcoming: any[];
    completed: any[];
}

export interface CallStatsPagination {
    next?: string;
    hasMore: boolean;
    page: number;
    size: number;
    total: number;
}

export interface CallStatsResponse {
    stats: CallStats;
    calls: PaginatedCalls;
    pagination: CallStatsPagination;
}

export interface CallStatsReport {
    call_cid: string;
    call_session_id: string;
    first_stats_time: Date;
    call_status: string;
    quality_score?: number;
    created_at?: Date;
    call_duration_seconds: number;
}

export interface CallStatsAnalytics {
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    averageQualityScore: number;
    callsByStatus: {
        [key: string]: number;
    };
    callsByDuration: {
        short: number; // < 5 minutes
        medium: number; // 5-15 minutes
        long: number; // > 15 minutes
    };
    qualityScoreRanges: {
        excellent: number; // 90-100
        good: number; // 70-89
        fair: number; // 50-69
        poor: number; // < 50
    };
    timeDistribution: {
        [key: string]: number;
    };
}

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

export interface ScheduleCallArgs {
    title: string;
    type: string;
    sessionId: string;
    starts_at: string;
    tokenGate?: string[];
}

export interface QueryParams {
    [key: string]: number | string;
}

export interface LeaderboardResponse {
    userId: string;
    username: string;
    displayImage?: string;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
}

export interface DetailedCallStatsResponse {
    analytics: CallStatsAnalytics;
    reports: CallStatsReport[];
    pagination: {
        next?: string;
        prev?: string;
        hasMore: boolean;
        total: number;
    };
    duration: string;
}

export interface ApiResponse<T> {
    status: string;
    message: string;
    data?: T;
    error?: boolean;
}
