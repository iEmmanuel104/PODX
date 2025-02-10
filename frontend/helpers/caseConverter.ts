const isArray = Array.isArray;
const isObject = (value: unknown): boolean =>
    typeof value === 'object' && !isArray(value) && value !== null;

type CaseType = 'camelCase' | 'constantCase' | 'kebabCase' | 'sentenceCase' | 'snakeCase' | 'upperCase';

// Native implementations of case conversions
const toCamelCase = (str: string): string => {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

const toKebabCase = (str: string): string => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
};

const toSnakeCase = (str: string): string => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
};

const toSentenceCase = (str: string): string => {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => ' ' + chr.toUpperCase())
        .trim();
};

export const changeCase = (input: string, caseType: CaseType): string => {
    switch (caseType) {
        case 'camelCase':
            return toCamelCase(input);
        case 'kebabCase':
            return toKebabCase(input);
        case 'snakeCase':
            return toSnakeCase(input);
        case 'constantCase':
            return input.toUpperCase().replace(/[\s-]+/g, '_');
        case 'upperCase':
            return input.toUpperCase();
        case 'sentenceCase':
            return toSentenceCase(input);
        default:
            return input;
    }
};

// Optimized key case conversion
const convertCamelToSnakeCase = (s: string): string =>
    s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const convertSnakeToCamelCase = (s: string): string =>
    s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

type caseType = 'camelCase' | 'snakeCase';

export const convertKeysCase = (data: unknown, type?: caseType): object => {
    if (isObject(data)) {
        return Object.fromEntries(
            Object.entries(data as object).map(([key, val]) => [
                type === 'snakeCase' ? convertCamelToSnakeCase(key) : convertSnakeToCamelCase(key),
                convertKeysCase(val, type)
            ])
        );
    }

    if (isArray(data)) {
        return (data as unknown[]).map(val => convertKeysCase(val, type));
    }

    return data as object;
};