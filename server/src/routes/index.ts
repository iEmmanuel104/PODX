import express, { Router } from 'express';
import userRoute from './user.routes';
import callRoutes from './calls.routes';
import streakRoutes from './streak.routes';
import webhookRoutes from './webhook.routes';
import poapRoutes from './poap.routes';
import healthRouter from './health.routes';

const router = Router();

router
    .use('/calls', callRoutes)
    .use('/streak', streakRoutes)
    .use('/user', userRoute)
    .use('/webhooks', webhookRoutes)
    .use('/poap', poapRoutes)
    .use('/health', healthRouter);

export default router;