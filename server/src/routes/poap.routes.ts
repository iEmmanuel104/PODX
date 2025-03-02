import express, { Router } from 'express';
import { POAPController } from '../controllers/poap.controller';
import { AuthenticatedController, basicAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// POAP retrieval routes
router
    .get('/user/:userId', POAPController.getUserPOAPs)
    .get('/call/:callId', POAPController.getCallPOAPs)
    .get('/meetings', POAPController.getAllMeetings)
    .get('/meetings/count', POAPController.getMeetingCount)
    .get('/meeting/:meetingAddress', POAPController.getMeetingDetails)
    .get('/wallet/:walletAddress/calls', POAPController.getWalletPOAPCalls);

// Verification routes
router
    .get('/verify/:meetingAddress/:walletAddress', POAPController.verifyWalletOwnership);

// Token gating routes
router
    .get('/tokengate/:sessionName/:walletAddress', POAPController.checkTokenGateAccess)
    .get('/tokengate/direct/:meetingAddress/:walletAddress', POAPController.checkDirectTokenGateAccess)
    .get('/tokengate/options/:walletAddress', basicAuth(), AuthenticatedController(POAPController.getUserTokenGateOptions))
    .post('/tokengate/external', basicAuth(), AuthenticatedController(POAPController.saveExternalTokenGateAddresses));

export default router; 