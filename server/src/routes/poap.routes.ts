import express from 'express';
import { POAPController } from '../controllers/poap.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { authorize } from '../middlewares/authMiddleware';
import { triggerPOAPIssuance } from '../controllers/poap.controller';

const router = express.Router();

// Authenticated endpoints
router.use(authenticate);

// User and call POAP operations
router.get('/user/:walletAddress', POAPController.getUserPOAPs);
router.get('/call/:callId', POAPController.getCallPOAPs);
router.get('/meeting/:meetingAddress', POAPController.getMeetingDetails);
router.get('/meetings', POAPController.getAllMeetings);
router.get('/meetings/count', POAPController.getMeetingCount);
router.get('/wallet/:walletAddress/meetings', POAPController.getWalletPOAPCalls);

// Generate POAP (following existing pattern)
router.get('/generate/:callId', POAPController.generatePOAPs);

// Verification routes
router.get('/verify/:meetingAddress/:walletAddress', POAPController.verifyWalletOwnership);

// Token gating routes
router.get('/tokengate/:sessionName/:walletAddress', POAPController.checkTokenGateAccess);
router.get('/tokengate/direct/:meetingAddress/:walletAddress', POAPController.checkDirectTokenGateAccess);
router.get('/tokengate/options/:walletAddress', POAPController.getUserTokenGateOptions);
router.post('/tokengate/external', POAPController.saveExternalTokenGateAddresses);

// POAP status and generation - require admin access
router.get('/status/:callId', authorize(['admin']), POAPController.getPoapStatus);
// The POST version is kept for admin use with authorization
router.post('/generate/:callId', authorize(['admin']), POAPController.generatePOAPs);

router.get('/issue-poap/:callId', triggerPOAPIssuance);

export default router; 