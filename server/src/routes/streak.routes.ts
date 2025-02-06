import express, { Router } from 'express';
import { StreakController } from '../controllers/streak.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .get('/leaderboard', StreakController.getLeaderboard)
    .post('/sync-user', basicAuth(), AuthenticatedController(StreakController.recalculateUserStreak))
    .post('/sync-local', StreakController.recalculateAllStreaks)
    .post('/sync-streamio', StreakController.syncStreaksWithStreamIO);

export default router;