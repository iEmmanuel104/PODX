import express, { Router } from 'express';
import UserController from '../controllers/user.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

// Configure the upload middleware for single file upload
const upload = uploadMiddleware(UploadType.Single, 'file');

router
    .get('/', AuthenticatedController(UserController.getAllUsers))
    .get('/info', AuthenticatedController(UserController.getUser))
    .post('/validate', basicAuth(), upload, AuthenticatedController(UserController.findOrCreateUser))
    .patch('/update', basicAuth(), upload, AuthenticatedController(UserController.updateUser));
    
export default router;

