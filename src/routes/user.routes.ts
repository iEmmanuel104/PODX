import express, { Router } from 'express';
import UserController from '../controllers/user.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .get('/', basicAuth(), AuthenticatedController(UserController.getAllUsers))
    .post('/validate', UserController.validateUser)
    .patch('/update', basicAuth(), AuthenticatedController(UserController.updateUser));

export default router;

