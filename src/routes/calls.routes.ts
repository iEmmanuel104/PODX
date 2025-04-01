import express, { Router } from 'express';
import multer from 'multer';
import CallsController from '../controllers/calls.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

router.post('/schedule', basicAuth(), AuthenticatedController(CallsController.scheduleCall));

router.get('/scheduled', basicAuth(), AuthenticatedController(CallsController.getUserScheduledCalls));

router.get('/info/:sessionId', basicAuth(), AuthenticatedController(CallsController.getCall));

router.delete('/scheduled/:sessionId', basicAuth(), AuthenticatedController(CallsController.deleteScheduledCall));

// Stream call management routes

router.post('/create', basicAuth(), upload.single('image'), AuthenticatedController(CallsController.createCall));

router.post('/get-or-create', basicAuth(), AuthenticatedController(CallsController.getOrCreateCall));

router.patch('/settings', basicAuth(), AuthenticatedController(CallsController.updateCallSettings));

router.patch('/members', basicAuth(), AuthenticatedController(CallsController.updateCallMembers));

router.post('/end', basicAuth(), AuthenticatedController(CallsController.endCall));

// Call information routes

router.get('/stats', CallsController.getCallStats);

router.get('/detailed-stats', CallsController.getDetailedCallStats);

router.post('/members', CallsController.queryCallMembers);

export default router;