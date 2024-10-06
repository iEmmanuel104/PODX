/* eslint-disable no-unused-vars */
import { CorsOptions } from 'cors';
import { logger } from './logger';

const whitelist = [
    'https://royalti.io',
    'https://api-dev.royalti.io',
    'https://api-prod.royalti.io',
    'http://127.0.0.1:8080',
    'https://server-dot-royalti-project.uc.r.appspot.com',
]; // list of allowed domains

const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        logger.warn('cors:', { origin });
        // if (whitelist.indexOf(origin!) !== -1) { // deos the actual check
        if (whitelist.indexOf(origin!)) {
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
