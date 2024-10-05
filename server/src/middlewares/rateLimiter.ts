// import { suspiciousActivityEmail } from '../utils/mailTemplates';
import { redisClient } from '../utils/redis';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/customErrors';
import UserService, { IDynamicQueryOptions } from '../services/user.service';

type RateLimitType = 'login' | 'forgot' | 'contact';

// fixed window rate limiter
const rateLimiter = (secondsLimit: number, limitAmount: number, type: RateLimitType) => async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] as string;
    const userLocation = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    const email = (req.body.email as string) || (await UserService.viewSingleUserDynamic(
        {
            query: { email: req.body.email },
            attributes: ['email'],
        } as IDynamicQueryOptions)
    ).email;

    const emailCounterKey = `EmailCounter:${email}`;
    const emailHashKey = `EmailHash_${type}:${email}`;

    try {
        // Increment the counter and set the expiration
        const [incrResult, expireResult] = await Promise.all([
            redisClient.incr(emailCounterKey),
            redisClient.expire(emailCounterKey, secondsLimit),
        ]);

        console.log('incrResult', incrResult);
        console.log('expireResult', expireResult);
        // Check if the increment result exceeds the limit
        if (incrResult > limitAmount) {
            const cachedAttempts = await redisClient.hgetall(emailHashKey);
            const attempts = Object.values(cachedAttempts).map((attempt: string) => JSON.parse(attempt));

            console.log('Sending suspicious email notification', attempts);
            // await suspiciousActivityEmail(email, attempts);
            throw new BadRequestError('Too many attempts. Please try again later.');
        } else {
            // Store attempt details in Redis hash
            await redisClient.hset(emailHashKey, incrResult.toString(), JSON.stringify({
                ip,
                userAgent,
                userLocation,
            }));
            // Set the expiry for the hash key and its components every 6 hours
            await redisClient.expire(emailHashKey, 6 * 60 * 60); // 6 hours in seconds
            next();
        }
    } catch (error) {
        if (error instanceof BadRequestError) {
            // Handle the custom error message appropriately
            res.status(400).json({ msg: error.message });
        } else {
            console.error('Redis error:', error);
            // Handle other errors, possibly sending a 500 response
            // res.status(500).json({ error: 'Internal server error' });
            next();
        }
    }
};

// sliding window rate limiter
const slidingWindowRateLimiter = (windowSizeInSeconds: number, limitAmount: number, type: RateLimitType) => async (req: Request, res: Response, next: NextFunction) => {
    // const ip = req.ip;
    // const userAgent = req.headers['user-agent'] as string;
    // const userLocation = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    const email = (req.body.email as string) || (await UserService.viewSingleUserDynamic(
        {
            query: { email: req.body.email },
            attributes: ['email'],
        } as IDynamicQueryOptions)
    ).email;

    const currentTimestamp = Date.now();
    const windowStartTimestamp = currentTimestamp - windowSizeInSeconds * 1000;
    const emailTimestampsKey = `EmailTimestamps:${type}:${email}`;

    try {
        // Remove timestamps outside the current window
        await redisClient.zremrangebyscore(emailTimestampsKey, 0, windowStartTimestamp);

        // Count the number of requests in the current window
        const requestCount = await redisClient.zcard(emailTimestampsKey);

        if (requestCount >= limitAmount) {
            // Too many requests
            throw new BadRequestError('Too many attempts. Please try again later.');
        } else {
            // Add the current request timestamp to the sorted set
            await redisClient.zadd(emailTimestampsKey, currentTimestamp.toString(), currentTimestamp.toString());
            // Set the expiry for the sorted set to clean up
            await redisClient.expire(emailTimestampsKey, windowSizeInSeconds);

            // Proceed with the request
            next();
        }
    } catch (error) {
        if (error instanceof BadRequestError) {
            // Handle the custom error message appropriately
            res.status(400).json({ msg: error.message });
        } else {
            console.error('Redis error:', error);
            // Handle other errors, potentially sending a 500 response
            next(error);
        }
    }
};

export { rateLimiter, slidingWindowRateLimiter };
