import { QueryParams } from './types';
import { formatEndpoint } from '@/helpers/url';

const namespace = 'calls';

export const CALLS_ENDPOINTS = {
    scheduleCall: (): string => formatEndpoint('schedule', namespace),
    retrieveCall: (sessionId: string): string => formatEndpoint(`info/${sessionId}`, namespace),
    listUserScheduledCalls: (): string => formatEndpoint('scheduled', namespace),
    listCallStats: (queryParams: QueryParams): string =>
        formatEndpoint(
            'stats',
            namespace,
            queryParams
                ? { queryParams: queryParams, removeTrailingSlash: true }
                : { removeTrailingSlash: true }
        ),
    listDetailedCallStats: (queryParams: QueryParams): string =>
        formatEndpoint(
            'detailed-stats',
            namespace,
            queryParams
                ? { queryParams: queryParams, removeTrailingSlash: true }
                : { removeTrailingSlash: true }
        ),
    listUserCalls: (): string => formatEndpoint('user-calls', namespace),
    listCallDetails: (callId: string): string => formatEndpoint(`${callId}`, namespace),
    listLeaderboard: (queryParams: QueryParams): string =>
        formatEndpoint(
            'leaderboard',
            namespace,
            queryParams
                ? { queryParams: queryParams, removeTrailingSlash: true }
                : { removeTrailingSlash: true }
        ),
};
