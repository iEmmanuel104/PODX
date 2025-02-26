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
