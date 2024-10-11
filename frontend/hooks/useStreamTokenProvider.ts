import { useCallback } from 'react';
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";

export const useStreamTokenProvider = () => {
    const [findOrCreateUser] = useFindOrCreateUserMutation();

    const tokenProvider = useCallback(
        async (walletAddress: string = "") => {
            const response = await findOrCreateUser({ walletAddress });
            const userData = response.data?.data as UserInfo;
            return userData.streamToken;
        },
        [findOrCreateUser]
    );

    return tokenProvider;
};