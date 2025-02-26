// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_content-disposition_and_link_headers
/** Can handle strings with parentheses */
export const safeEncodeURIComponent = (s: string): string =>
    encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16));

export const isValidUrl = (url: string): boolean =>
    /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/.test(
        url
    );

type QueryParams = Record<string, number | string>;

export const createQueryString = (params: QueryParams): string =>
    Object.entries(params)
        .map(
            ([key, value]) =>
                `${safeEncodeURIComponent(key)}=${safeEncodeURIComponent(String(value))}`
        )
        .join('&');

export const formatEndpoint = (
    endpoint: string,
    namespace: string,
    {
        removeTrailingSlash,
        ...options
    }: { queryParams?: QueryParams; removeTrailingSlash?: boolean } = {
        removeTrailingSlash: false,
    }
): string => {
    const base = endpoint ? `${namespace}/${endpoint}/` : `${namespace}/`;
    const query = options.queryParams ? `?${createQueryString(options.queryParams)}` : '';
    // Remove last slash if removeTrailingSlash is true
    return `${removeTrailingSlash ? base.replace(/\/$/, '') : base}${query}`;
};
