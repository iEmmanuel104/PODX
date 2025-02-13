import express, { Router } from 'express';
import UserController from '../controllers/user.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

// Configure the upload middleware for single file upload
const upload = uploadMiddleware(UploadType.Single, 'file');

router
    .get('/', AuthenticatedController(UserController.getAllUsers))
    .get('/info', basicAuth(), AuthenticatedController(UserController.getUser))
    .get('/streak-stats', basicAuth(), AuthenticatedController(UserController.getUserStreakStats))
    .post('/validate', UserController.validateUser)
    .get('/calls', basicAuth(), AuthenticatedController(UserController.getUserCalls))
    .get('/calls/local', basicAuth(), AuthenticatedController(UserController.getUserCallsLocal))
    .patch('/update', basicAuth(), upload, AuthenticatedController(UserController.updateUser));

export default router;

