import { Router } from 'express';
import userRoute from './user.routes';
import callRoutes from './calls.routes';

const router = Router();

router
    .use('/calls', callRoutes)
    .use('/user', userRoute);

export default router;


