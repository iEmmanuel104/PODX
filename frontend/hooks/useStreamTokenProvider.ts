'use client';
import { useCallback, useRef } from 'react';
import { useFindOrCreateUserMutation, UserInfo } from "@/store/api/userApi";

export const useStreamTokenProvider = () => {
    const [findOrCreateUser] = useFindOrCreateUserMutation();
    const tokenCache = useRef<{ [key: string]: string }>({});

    const tokenProvider = useCallback(
        async (walletAddress: string = "") => {
            // console.log("token provider hit", {tokenCache});
            if (tokenCache.current[walletAddress]) {
                return tokenCache.current[walletAddress];
            }

            try {
                const response = await findOrCreateUser({ walletAddress }).unwrap();
                // console.log({ response });
                const userData = response.data as UserInfo;
                tokenCache.current[walletAddress] = userData.streamToken;
                return userData.streamToken;
            } catch (error) {
                console.error("Error fetching token:", error);
                throw error;
            }
        },
        [findOrCreateUser]
    );

    return tokenProvider;
};