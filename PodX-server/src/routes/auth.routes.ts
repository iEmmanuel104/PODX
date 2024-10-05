import express, { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    // Signup route
    .post('/signup', AuthController.signup)

    // Wallet verification route
    .post('/verifywallet', AuthController.verifyWallet)

    // Login route
    .post('/login', AuthController.login)

    // Logout route
    .get('/logout', basicAuth(), AuthenticatedController(AuthController.logout))

    // Get logged user data route
    .get('/loggeduser', basicAuth(), AuthenticatedController(AuthController.getLoggedUserData))

    // Refresh token route
    .get('/refreshtoken', basicAuth());


export default router;