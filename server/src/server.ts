import http from 'http';
import app from './app';
import { initiateMongoDB } from './models/Mongodb';
// import { initiateDB } from './models/Postgres';
// import { initializeSocketIO } from './socket';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis';

// Asynchronous function to start the server
async function startServer(): Promise<void> {
    try {
        await redisClient.on('connect', () => {
            logger.info('Connection to REDIS database successful');
        });
        // Initiate a connection to the database
        // await initiateDB();
        await initiateMongoDB();

        // Start the server and listen on port 8080
        const server = http.createServer(app);
        // initializeSocketIO(server);

        const port = process.env.PORT || 8090;
        server.listen(port, () => {
            logger.info(`Server is running on Port ${port}`);
        });
    } catch (err) {
        console.log(err);
        logger.error(err);
        // exit redis client
        redisClient.quit((err, result) => {
            if (err) {
                console.error('Error quitting Redis:', err);
            } else {
                console.log('Redis instance has been stopped:', result);
            }
        });
        // Exit the process with a non-zero status code to indicate an error
        process.exit(1);
    }
}

// Call the function to start the server
startServer();