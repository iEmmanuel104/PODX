import { Router } from 'express';
import authRoute from './auth.routes';
import userRoute from './user.routes';
// import AdminRoutes from './Admin/admin.routes';


const router = Router();

router
    .use('/auth', authRoute)
    // .use('/iamBase', adminRoute)
    .use('/user', userRoute);

export default router;


