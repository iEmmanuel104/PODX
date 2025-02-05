import express, { Router } from 'express';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// all calls routes
router
    .post('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall))
    .get('/scheduled', basicAuth(), AuthenticatedController(CallsController.getUserScheduledCalls))
    .get('/:sessionId', basicAuth(), AuthenticatedController(CallsController.getCall));

// Stream call management routes
router
    .post('/create', basicAuth(), AuthenticatedController(CallsController.createCall))
    .post('/get-or-create', basicAuth(), AuthenticatedController(CallsController.getOrCreateCall))
    .patch('/settings', basicAuth(), AuthenticatedController(CallsController.updateCallSettings))
    .patch('/members', basicAuth(), AuthenticatedController(CallsController.updateCallMembers))
    .post('/end', basicAuth(), AuthenticatedController(CallsController.endCall));

// Call information routes
router
    .get('/stats', CallsController.getCallStats)
    .get('/detailed-stats', CallsController.getDetailedCallStats)
    .get('/:callId', CallsController.getCallDetails)
    .post('/members', CallsController.queryCallMembers)
    .get('/leaderboard/rankings', CallsController.getLeaderboard);

export default router;