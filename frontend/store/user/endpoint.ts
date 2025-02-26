import { formatEndpoint } from '@/helpers/url';

const namespace = 'user';

export const USER_ENDPOINTS = {
    validateUser: (): string => formatEndpoint('validate', namespace),
    updateUsername: (): string => formatEndpoint('update', namespace),
    retrieveUser: (id: string): string =>
        formatEndpoint(`info`, namespace, {
            queryParams: { id: id.toString() },
            removeTrailingSlash: true,
        }),
    getUserCalls: (filter?: string): string =>
        formatEndpoint('calls/local', namespace, {
            queryParams: filter ? { filter } : undefined,
            removeTrailingSlash: true,
        }),
    getUserTipHistory: (filter?: string): string =>
        formatEndpoint('calls/tips', namespace, {
            queryParams: filter ? { filter } : undefined,
            removeTrailingSlash: true,
        }),
};
