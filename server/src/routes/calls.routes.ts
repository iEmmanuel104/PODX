import express, { Router } from 'express';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// all calls routes
router
    .post('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall))
    .get('/scheduled', basicAuth(), AuthenticatedController(CallsController.getUserScheduledCalls))
    .get('/info/:sessionId', basicAuth(), AuthenticatedController(CallsController.getCall))
    .delete('/scheduled/:sessionId', basicAuth(), AuthenticatedController(CallsController.deleteScheduledCall))

// Stream call management routes

    .post('/create', basicAuth(), AuthenticatedController(CallsController.createCall))
    .post('/get-or-create', basicAuth(), AuthenticatedController(CallsController.getOrCreateCall))
    .patch('/settings', basicAuth(), AuthenticatedController(CallsController.updateCallSettings))
    .patch('/members', basicAuth(), AuthenticatedController(CallsController.updateCallMembers))
    .post('/end', basicAuth(), AuthenticatedController(CallsController.endCall))

// Call information routes

    .get('/stats', CallsController.getCallStats)
    .get('/detailed-stats', CallsController.getDetailedCallStats)
    .post('/members', CallsController.queryCallMembers);

export default router;