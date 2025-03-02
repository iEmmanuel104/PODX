import ejs from 'ejs';
import path from 'path';

interface ServerHealthData {
    serverStatus: string;
    message: string;
    documentation: string;
    client: string;
    admin: string;
}

export async function serverHealth(data: ServerHealthData): Promise<string> {
    // Instead of rendering an EJS template, return a JSON string
    const healthInfo = {
        status: data.serverStatus,
        message: data.message,
        documentation_url: data.documentation,
        client_url: data.client,
        admin_url: data.admin,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime() + ' seconds'
    };
    
    return JSON.stringify(healthInfo, null, 2);
} 