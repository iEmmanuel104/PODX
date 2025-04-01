import express, { Router } from 'express';
import { getServerHealth } from '../views/serverHealthCheck';

const router: Router = express.Router();

router.get('/', getServerHealth);

export default router; 