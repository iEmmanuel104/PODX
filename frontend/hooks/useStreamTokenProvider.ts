'use client';
import { useValidateUserMutation } from '@/store/user/slice';
import { UserInfo } from '@/store/user/types';
import { useCallback, useRef } from 'react';

export const useStreamTokenProvider = () => {
    const [validateUser] = useValidateUserMutation();
    const tokenCache = useRef<{ [key: string]: string }>({});

    const tokenProvider = useCallback(
        async (walletAddress: string = '') => {
            if (tokenCache.current[walletAddress]) {
                return tokenCache.current[walletAddress];
            }

            try {
                const response = await validateUser({ walletAddress }).unwrap();
                const userData = response.data as UserInfo;
                tokenCache.current[walletAddress] = userData.streamToken;
                return userData.streamToken;
            } catch (error) {
                console.error('Error fetching token:', error);
                throw error;
            }
        },
        [validateUser]
    );

    return tokenProvider;
};
