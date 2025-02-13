import { api } from "../config/base";
import { USER_ENDPOINTS } from "./endpoint";
import type {
    UpdateUsernameArgs, UpdateUsernameResponse, UserInfo, ValidateUserArgs,
    ValidateUserResponse, GetUserCallsResponse, GetUserCallsArgs
} from "./types";
import { createTag } from "../config/tags";

export const userSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        validateUser: builder.mutation<ValidateUserResponse, ValidateUserArgs>({
            query: ({ walletAddress, hash }) => ({
                body: { walletAddress, ...(hash ? { hash: 'true' } : {}) },
                method: 'POST',
                url: USER_ENDPOINTS.validateUser()
            }),
            invalidatesTags: [createTag('User')],
            transformResponse: (response: ValidateUserResponse) => response
        }),
        updateUsername: builder.mutation<UpdateUsernameResponse, UpdateUsernameArgs>({
            query: ({ username }) => ({
                body: { username },
                method: 'PATCH',
                url: USER_ENDPOINTS.updateUsername()
            }),
            invalidatesTags: [createTag('User')],
        }),
        retrieveUser: builder.query<UserInfo, string>({
            query: (id) => ({
                method: 'GET',
                url: USER_ENDPOINTS.retrieveUser(id)
            }),
            providesTags: [createTag('User')],
        }),
        getUserCalls: builder.query<GetUserCallsResponse, GetUserCallsArgs | void>({
            query: (args) => ({
                method: 'GET',
                url: USER_ENDPOINTS.getUserCalls(args?.filter),
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.calls.map(call =>
                            createTag({
                                type: 'UserCalls',
                                prefix: 'userCallsId',
                                id: call.callId
                            })
                        ),
                        createTag('UserCalls')
                    ]
                    : [createTag('UserCalls')],
            transformResponse: (response: GetUserCallsResponse) => response,
        }),
    }),
})

export const { useRetrieveUserQuery, useUpdateUsernameMutation, useValidateUserMutation, useGetUserCallsQuery } = userSlice;