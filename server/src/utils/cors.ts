/* eslint-disable no-unused-vars */
import { CorsOptions } from 'cors';
import { logger } from './logger';

const whitelist = [
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'https://podx-pi.vercel.app',
]; // list of allowed domains

const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        logger.warn('cors:', { origin });
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
    credentials: true, // enable set cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};

export default corsOptions;
