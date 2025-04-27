import http from 'http';
import app from './app';
import { initiateMongoDB } from './models/Mongodb';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis';

// Asynchronous function to start the server
async function startServer(): Promise<void> {
    try {
        redisClient.on('connect', () => {
            logger.info('Connection to REDIS database successful');
        });

        // Initiate MongoDB connection
        await initiateMongoDB();

        // Start the server
        const server = http.createServer(app);
        const port = parseInt(process.env.PORT || '8054');

        server.listen(port, () => {
            logger.info('Running server');
            logger.info(`Server is running on Port ${port}`);
            
            // Log Swagger documentation URL
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'https://api.podx.fun' 
                : `http://localhost:${port}`;
            
            logger.info('\n📚 API Documentation:');
            console.info(`${baseUrl}/api-docs - Swagger UI`);
            console.info(`${baseUrl}/api/v0 - API Base URL\n`);
            
            logger.info(`Swagger documentation is available at ${baseUrl}/api-docs`);
        });

        process.on("SIGINT", () => {
            logger.debug("Gracefully shutting down");
            server.close(() => {
                console.log("Closed all connections");
                process.exit(0);
            });
        });
    } catch (err) {
        // console.log(err);
        logger.error(err);

        // Clean up Redis connection
        redisClient.quit((err, result) => {
            if (err) {
                logger.error('Error quitting Redis:', err);
            } else {
                logger.info('Redis instance has been stopped:', result);
            }
        });

        // Exit the process with error
        process.exit(1);
    }
}

// Start the server
startServer();