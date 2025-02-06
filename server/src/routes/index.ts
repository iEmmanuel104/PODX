import { Router } from 'express';
import userRoute from './user.routes';
import callRoutes from './calls.routes';
import streakRoutes from './streak.routes';

const router = Router();

router
    .use('/calls', callRoutes)
    .use('/streak', streakRoutes)
    .use('/user', userRoute);

export default router;