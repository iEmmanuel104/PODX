import { api } from '../config/base';
import { USER_ENDPOINTS } from './endpoint';
import type {
    UpdateUsernameArgs,
    UpdateUsernameResponse,
    UserInfo,
    ValidateUserArgs,
    ValidateUserResponse,
    GetUserCallsResponse,
    GetUserCallsArgs,
    GetUserTipHistoryArgs,
    GetUserTipHistoryResponse,
} from './types';
import { createTag } from '../config/tags';

export const userSlice = api.injectEndpoints({
    endpoints: builder => ({
        validateUser: builder.mutation<ValidateUserResponse, ValidateUserArgs>({
            query: ({ walletAddress, hash }) => ({
                body: { walletAddress, ...(hash ? { hash: 'true' } : {}) },
                method: 'POST',
                url: USER_ENDPOINTS.validateUser(),
            }),
            invalidatesTags: [createTag('User')],
            transformResponse: (response: ValidateUserResponse) => response,
        }),
        updateUsername: builder.mutation<UpdateUsernameResponse, UpdateUsernameArgs>({
            query: ({ username }) => ({
                body: { username },
                method: 'PATCH',
                url: USER_ENDPOINTS.updateUsername(),
            }),
            invalidatesTags: [createTag('User')],
        }),
        retrieveUser: builder.query<UserInfo, string>({
            query: id => ({
                method: 'GET',
                url: USER_ENDPOINTS.retrieveUser(id),
            }),
            providesTags: [createTag('User')],
        }),
        getUserCalls: builder.query<GetUserCallsResponse, GetUserCallsArgs | void>({
            query: args => ({
                method: 'GET',
                url: USER_ENDPOINTS.getUserCalls(args?.filter),
            }),
            providesTags: result =>
                result
                    ? [
                          ...result.data.calls.map(call =>
                              createTag({
                                  type: 'UserCalls',
                                  prefix: 'userCallsId',
                                  id: call.callId,
                              })
                          ),
                          createTag('UserCalls'),
                      ]
                    : [createTag('UserCalls')],
            transformResponse: (response: GetUserCallsResponse) => response,
        }),
        getUserTipHistory: builder.query<GetUserTipHistoryResponse, GetUserTipHistoryArgs | void>({
            query: args => ({
                method: 'GET',
                url: USER_ENDPOINTS.getUserTipHistory(args?.filter),
            }),
            providesTags: result =>
                result
                    ? [
                          ...result.data.tips.map(tip =>
                              createTag({
                                  type: 'UserTips',
                                  prefix: 'userTipsId',
                                  id: tip._id,
                              })
                          ),
                          createTag('UserTips'),
                      ]
                    : [createTag('UserTips')],
            transformResponse: (response: GetUserTipHistoryResponse) => response,
        }),
    }),
});

export const {
    useRetrieveUserQuery,
    useUpdateUsernameMutation,
    useValidateUserMutation,
    useGetUserTipHistoryQuery,
    useGetUserCallsQuery,
} = userSlice;
