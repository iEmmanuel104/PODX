import { Request, Response } from 'express';
import { BadRequestError, ForbiddenError } from '../utils/customErrors';
import Validator from '../utils/validators';
import Password from '../models/password.model';
import { AuthUtil } from '../utils/token';
import { emailService, EmailTemplate } from '../utils/Email';
import UserService from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export default class AuthController {

    static async signup(req: Request, res: Response) {
        const { walletAddress, email, firstName, lastName, username, password, type } = req.body;

        await UserService.isWalletAddressEmailAndUserNameAvailable(walletAddress, email, username);

        const newUser = await UserService.addUser({
            walletAddress,
            email,
            firstName,
            lastName,
            username,
            status: {
                activated: false,
                emailVerified: false,
                walletVerified: false,
            },
            type,
        });


        const otpCode = await AuthUtil.generateCode({ type: 'emailverification', identifier: newUser.id, expiry: 60 * 10 });


        const templateData = {
            otpCode,
            name: firstName,
        };

        console.log('sending email');
        await emailService.send({
            email: 'batch',
            subject: 'Account Activation',
            from: 'auth',
            isPostmarkTemplate: true,
            postMarkTemplateAlias: 'verify-email',
            postmarkInfo: [{
                postMarkTemplateData: templateData,
                receipientEmail: email,
            }],
            html: await new EmailTemplate().accountActivation({ otpCode, name: firstName }),
        });

        const validPassword = Validator.isValidPassword(password);

        if (!validPassword) {
            throw new BadRequestError('Invalid password format');
        }

        // Create a new password for the user
        await Password.create({ userId: newUser.id, password: password });

        res.status(201).json({
            status: 'success',
            message: 'Email verification code sent successfully',
            data: {
                user: newUser,
            },
        });
    }

    static async verifyWallet(req: Request, res: Response) {
        const { walletAddress, signature } = req.body;

        const user = await UserService.viewSingleUserByWalletAddress(walletAddress);

        if (user.status.walletVerified) throw new BadRequestError('Wallet already verified');

        // Verify the signature here
        const isValidSignature = AuthUtil.verifyWalletSignature(walletAddress, signature);
        if (!isValidSignature) throw new BadRequestError('Invalid signature');

        await user.update({ status: { ...user.status, walletVerified: true, activated: true } });

        const accessToken = await AuthUtil.generateToken({ type: 'access', user });
        const refreshToken = await AuthUtil.generateToken({ type: 'refresh', user });

        res.status(200).json({
            status: 'success',
            message: 'Wallet verified successfully',
            data: {
                user: user.dataValues,
                accessToken,
                refreshToken,
            },
        });
    }

    static async login(req: Request, res: Response) {
        const { walletAddress, signature } = req.body;

        const user = await UserService.viewSingleUserByWalletAddress(walletAddress);

        if (!user.status.walletVerified) {
            throw new BadRequestError('Wallet not verified. Please verify your wallet first.');
        }

        const isValidSignature = AuthUtil.verifyWalletSignature(walletAddress, signature);
        if (!isValidSignature) {
            throw new BadRequestError('Invalid signature');
        }

        if (user.settings.isBlocked) {
            throw new ForbiddenError('Oops! Your account has been blocked. Please contact support');
        }

        if (!user.status.activated) {
            await user.update({ status: { ...user.status, activated: true } });
        }

        const accessToken = await AuthUtil.generateToken({ type: 'access', user });
        const refreshToken = await AuthUtil.generateToken({ type: 'refresh', user });

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: user.dataValues,
                accessToken,
                refreshToken,
            },
        });
    }

    static async logout(req: AuthenticatedRequest, res: Response) {
        // await AuthUtil.deleteToken({ user: req.user, tokenType: 'access', tokenClass: 'token' });
        // await AuthUtil.deleteToken({ user: req.user, tokenType: 'refresh', tokenClass: 'token' });

        res.status(200).json({
            status: 'success',
            message: 'Logout successful',
            data: null,
        });
    }

    static async getLoggedUserData(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        res.status(200).json({
            status: 'success',
            message: 'user data retrieved successfully',
            data: {
                user: user.dataValues,
            },
        });
    }
}