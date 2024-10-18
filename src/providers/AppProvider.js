import { Provider } from '@reduxjs/toolkit/query/react';
import { store } from '../store';
import { PrivyProvider } from './privyProvider';
import { AuthProvider } from './authProvider';

export function AppProvider({ children }) {
    return (
        <Provider store={store}>
            <PrivyProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </PrivyProvider>
        </Provider>
    );
}
