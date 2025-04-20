import express, { Router } from 'express';
import Huddle01Controller from '../controllers/huddle01.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// Token generation for joining rooms
router.get('/token/:roomId', basicAuth(), AuthenticatedController(Huddle01Controller.generateAccessToken));

export default router; 