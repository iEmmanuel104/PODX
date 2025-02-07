import { convertKeysCase } from "@/helpers/caseConverter";
import { api } from "../config/base";
import { USER_ENDPOINTS } from "./endpoint";
import type { UpdateUsernameArgs, UpdateUsernameResponse, UserInfo, ValidateUserArgs, ValidateUserResponse } from "./types";
import { createTag } from "../config/tags";

export const userSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        validateUser: builder.mutation<ValidateUserResponse, ValidateUserArgs>({
            query: (payload) => ({
                body: payload,
                method: 'POST',
                url: USER_ENDPOINTS.validateUser()
            }),
            invalidatesTags: [createTag('User')],
            transformResponse: (response: ValidateUserResponse) => response 
        }),
        updateUsername: builder.mutation<UpdateUsernameResponse, UpdateUsernameArgs>({
            query: ({username}) => ({
                body: {username},
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
    }),
})

export const { useRetrieveUserQuery, useUpdateUsernameMutation, useValidateUserMutation } = userSlice;