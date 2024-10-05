// serverHealthController.ts

import { Request, Response } from 'express';
import { DOCUMENTATION_URL, WEBSITE_URL } from '../utils/constants';
import { serverHealth } from './serverhealth';

export async function getServerHealth(req: Request, res: Response): Promise<void> {
    const data = {
        serverStatus: 'success',
        message: `Welcome to Shortlet-Lagos ${process.env.NODE_ENV} server`,
        documentation: DOCUMENTATION_URL,
        client: WEBSITE_URL,
        admin: 'www.twitter.com',
    };

    try {
        const html = await serverHealth(data);
        res.send(html);

    } catch (error) {
        console.error(error);
        handleError(res);
    }
}

function handleError(res: Response): void {
    console.error('Error rendering EJS view');
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
    });
}
