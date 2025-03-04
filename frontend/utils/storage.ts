
type CacheData = {
    value: any;
    timestamp: number;
    expiry: number;
};

export const storage = {
    set: (key: string, value: any, expiry = 3600) => {
        try {
            const data: CacheData = {
                value,
                timestamp: Date.now(),
                expiry: expiry * 1000, // Convert to milliseconds
            };
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Storage error:', error);
        }
    },

    get: (key: string): any | null => {
        try {
            const data = JSON.parse(sessionStorage.getItem(key) || '');
            if (!data) return null;

            if (Date.now() - data.timestamp > data.expiry) {
                sessionStorage.removeItem(key);
                return null;
            }
            return data.value;
        } catch {
            return null;
        }
    },

    clear: (key: string) => {
        sessionStorage.removeItem(key);
    },
};



export function clearStoredValue(key: string) {
    // Clear the pending session code
    localStorage.removeItem(key);

    // Clear the cookie too
    document.cookie = `${key}=; path=/; max-age=0`;
}

export function cacheValue(key: string, value: string) {
    // Save the session code for after login in both localStorage and cookie
    localStorage.setItem(key, value);
    
    // Also store in a cookie for more reliable persistence
    document.cookie = `${key}=${value}; path=/; max-age=3600`;
}


export function getSessionCode(pathname: string, option:{isPodJoinPage: boolean, isDirectPodPage: boolean}): string | undefined {
    let sessionCode;
    const {isPodJoinPage, isDirectPodPage} = option;

    if (isPodJoinPage) {
        sessionCode = pathname.split('/pod/join/')[1];
    } else if (isDirectPodPage) {
        sessionCode = pathname.split('/pod/')[1];
    }

    if (sessionCode) {
        localStorage.setItem('pendingSessionCode', sessionCode);
    }

    return sessionCode;
}