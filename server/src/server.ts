import http from 'http';
import app from './app';
import { initiateMongoDB } from './models/Mongodb';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis';

// Example function where 'err' is used
function handleError(err: Error) { // Explicitly type 'err'
  console.error(err);
}

// Asynchronous function to start the server
async function startServer(): Promise<void> {
    try {
        await redisClient.on('connect', () => {
            logger.info('Connection to REDIS database successful');
        });

        // Initiate MongoDB connection
        await initiateMongoDB();

        // Start the server
        const server = http.createServer(app);
        const port = process.env.PORT || 8090;

        server.listen(port, () => {
            logger.info(`Server is running on Port ${port}`);
        });
    } catch (err) {
        console.log(err);
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