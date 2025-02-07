// eslint-disable-next-line import/no-extraneous-dependencies
import { camelCase, kebabCase, snakeCase, startCase, toLower, upperCase } from 'lodash';
import { match } from 'ts-pattern';

const isArray = (value: unknown): boolean => Array.isArray(value);

const isObject = (value: unknown): boolean => typeof value === 'object' && !isArray(value) && !!value;

type caseType = 'camelCase' | 'snakeCase';

const convertCamelToSnakeCase = (s: string): string => s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const convertSnakeToCamelCase = (s: string): string => s.replace(/([_][a-z])/g, ($1) => $1[1].toUpperCase());

export const convertKeysCase = (data: unknown, type?: caseType): object => {
  if (isObject(data)) {
    return Object.entries(data as object).reduce(
      (agg, [key, val]) => ({
        ...agg,
        [type === 'snakeCase' ? convertCamelToSnakeCase(key) : convertSnakeToCamelCase(key)]: convertKeysCase(
          val,
          type,
        ),
      }),
      {},
    );
  } else if (isArray(data)) {
    return (data as unknown[]).map((val) => convertKeysCase(val, type));
  } else {
    return data as object;
  }
};

type CaseType = 'camelCase' | 'constantCase' | 'kebabCase' | 'sentenceCase' | 'snakeCase' | 'upperCase';

export const changeCase = (input: string, caseType: CaseType): string =>
  match<CaseType, string>(caseType)
    .with('camelCase', () => camelCase(input))
    .with('kebabCase', () => kebabCase(input))
    .with('constantCase', () => upperCase(input).replace(/ /g, '_'))
    .with('snakeCase', () => snakeCase(input))
    .with('upperCase', () => input.toUpperCase())
    .with('sentenceCase', () => startCase(toLower(input)))
    .exhaustive();
