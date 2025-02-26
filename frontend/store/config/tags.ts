import type { ApiTagConfig } from './base';

const LIST_ID = 'LIST';

type CacheTag = keyof ApiTagConfig;
type CacheTagPrefix<TCacheTag extends CacheTag> = ApiTagConfig[TCacheTag]['prefixes'][number];
type CacheKey<TCacheTag extends CacheTag> =
    | typeof LIST_ID
    | `${CacheTagPrefix<TCacheTag>}:${string}`;
type CreateDetailTagInput<TCacheTagType extends CacheTag> = {
    id: string;
    prefix: CacheTagPrefix<TCacheTagType>;
    type: TCacheTagType;
};
type CreateListTagInput<TCacheTagType extends CacheTag> = {
    id: typeof LIST_ID;
    type: TCacheTagType;
};

export type CreateTagInput<TCacheTagType extends CacheTag> =
    | CreateDetailTagInput<TCacheTagType>
    | CreateListTagInput<TCacheTagType>
    | TCacheTagType;

type CreateTagOutput<TCacheTagType extends CacheTag> =
    | TCacheTagType
    | { id: CacheKey<TCacheTagType>; type: TCacheTagType };

export const createTag = <TCacheTagType extends CacheTag>(
    input: CreateTagInput<TCacheTagType>
): CreateTagOutput<TCacheTagType> => {
    if (typeof input === 'string') {
        return input;
    } else {
        const { id, type } = input;
        const outputId = (
            'prefix' in input ? `${input.prefix}:${id}` : id
        ) as CacheKey<TCacheTagType>;
        return { id: outputId, type };
    }
};
