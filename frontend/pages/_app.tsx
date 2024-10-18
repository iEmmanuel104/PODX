import { PrivyProvider } from '../providers/privyProvider';
import { AuthProvider } from '../providers/authProvider';

function MyApp({ Component, pageProps }) {
    return (
        <PrivyProvider>
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </PrivyProvider>
    );
}

export default MyApp;
