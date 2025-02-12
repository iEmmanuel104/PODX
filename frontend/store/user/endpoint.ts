import { formatEndpoint } from "@/helpers/url";

const namespace = 'user';

export const USER_ENDPOINTS = { 
    validateUser: (): string => formatEndpoint('validate', namespace),
    updateUsername: (): string => formatEndpoint('update', namespace),
    retrieveUser: (id: string): string => formatEndpoint(`info`, namespace, {queryParams: {id: id.toString()}, removeTrailingSlash: true}),
};