// hooks/useAuth.ts
import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { logOut } from '@/store/slices/userSlice';

export const useAuth = () => {
    const { login: privyLogin, logout: privyLogout, ready, authenticated } = usePrivy();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const login = useCallback(async () => {
        try {
            await privyLogin();
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, [privyLogin]);

    const logout = useCallback(async () => {
        try {
            // Clear local storage
            localStorage.removeItem('pendingSessionCode');

            // Clear Redux state
            dispatch(logOut());

            // Logout from Privy
            await privyLogout();

            // Redirect to home
            router.replace('/');

            // Optional: Clear any other app-specific state here
            // e.g., clear local storage, cookies, etc.

        } catch (error) {
            console.error('Logout failed:', error);
            // Even if there's an error, try to clear local state
            dispatch(logOut());
            router.replace('/');
            throw error;
        }
    }, [privyLogout, dispatch, router]);

    const connect = useCallback(async () => {
        try {
            // First ensure we're logged out completely
            await logout();
            // Then trigger login
            await login();
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        }
    }, [logout, login]);

    return {
        login,
        logout,
        connect,
        ready,
        authenticated
    };
};