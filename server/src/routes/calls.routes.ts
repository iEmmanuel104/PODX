import express, { Router } from 'express';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .post('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall))
    .get('/scheduled', basicAuth(), AuthenticatedController(CallsController.getUserScheduledCalls))
    .get('/scheduled/:sessionId', basicAuth(), AuthenticatedController(CallsController.getScheduledCall));

export default router;

