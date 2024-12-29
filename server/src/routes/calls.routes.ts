import express, { Router } from 'express';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// Scheduled calls routes
router
    .post('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall))
    .get('/scheduled', basicAuth(), AuthenticatedController(CallsController.getUserScheduledCalls))
    .get('/scheduled/:sessionId', basicAuth(), AuthenticatedController(CallsController.getScheduledCall));

// Stream call management routes
router
    .post('/create', basicAuth(), AuthenticatedController(CallsController.createCall))
    .post('/get-or-create', basicAuth(), AuthenticatedController(CallsController.getOrCreateCall))
    .patch('/settings', basicAuth(), AuthenticatedController(CallsController.updateCallSettings))
    .patch('/members', basicAuth(), AuthenticatedController(CallsController.updateCallMembers))
    .post('/end', basicAuth(), AuthenticatedController(CallsController.endCall));

// Call information routes
router
    .get('/stats', AuthenticatedController(CallsController.getCallStats))
    .get('/detailed-stats', AuthenticatedController(CallsController.getDetailedCallStats))
    .get('/user-calls', AuthenticatedController(CallsController.getUserCalls))
    .get('/:callId', AuthenticatedController(CallsController.getCallDetails));

export default router;