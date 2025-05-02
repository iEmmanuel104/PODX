import http from "http";
import app from "./app";
import { initiateMongoDB } from "./models/Mongodb";
import { logger } from "./utils/logger";
import { redisClient } from "./utils/redis";

// Asynchronous function to start the server
async function startServer(): Promise<void> {
    try {
        redisClient.on("connect", () => {
            logger.info("Connection to REDIS database successful");
        });

        // Initiate MongoDB connection
        await initiateMongoDB();

        // Start the server
        const server = http.createServer(app);
        const port = parseInt(process.env.PORT || "8054");

        server.listen(port, () => {
            logger.info("Running server");
            logger.info(`Server is running on Port ${port}`);

            // Log Swagger documentation URL
            const baseUrl =
                process.env.NODE_ENV === "production"
                    ? "https://api.podx.fun"
                    : `http://localhost:${port}`;

            logger.info("\n📚 API Documentation:");
            logger.info(`${baseUrl}/api-docs - Swagger UI`);
            logger.info(`${baseUrl}/api/v0 - API Base URL\n`);

            logger.info(
                `Swagger documentation is available at ${baseUrl}/api-docs`,
            );
        });

        process.on("SIGINT", () => {
            logger.debug("Gracefully shutting down");
            server.close(() => {
                logger.info("Closed all connections");
                process.exit(0);
            });
        });
    } catch (err) {
        // logger.info(err);
        logger.error("Server Error", err);

        // Clean up Redis connection
        try {
            const result = await redisClient.quit();
            logger.info("Redis instance has been stopped:", result);
        } catch (err) {
            logger.error("Error quitting Redis:", err);
        }

        // Exit the process with error
        process.exit(1);
    }
}

// Start the server
void startServer();
