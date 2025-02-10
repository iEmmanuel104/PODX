import { Router } from 'express';
import userRoute from './user.routes';
import callRoutes from './calls.routes';
import streakRoutes from './streak.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router
    .use('/calls', callRoutes)
    .use('/streak', streakRoutes)
    .use('/user', userRoute)
    .use('/webhooks', webhookRoutes);

export default router;