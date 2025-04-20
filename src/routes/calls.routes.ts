/**
 * Routes for managing video calls using Huddle01 API integration
 * Provides endpoints for creating, retrieving, and managing call sessions
 */
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
    },
});

// Create a new call room
router.post('/create', basicAuth(), upload.single('image'), AuthenticatedController(CallsController.createCall));

// Get call information by session ID
router.get('/info/:sessionId', basicAuth(), AuthenticatedController(CallsController.getCall));

// Get call statistics
router.get('/stats', CallsController.getCallStats);

// Get live participants in a meeting
router.get('/:roomId/live-participants', CallsController.getLiveParticipants);

// Generate access token for a call
router.post('/token', basicAuth(), AuthenticatedController(CallsController.generateToken));

export default router;