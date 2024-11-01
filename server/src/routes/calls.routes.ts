import express, { Router } from 'express';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .get('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall))
    .get('/scheduled/:sessionId', basicAuth(), AuthenticatedController(CallsController.getScheduledCall));

export default router;

