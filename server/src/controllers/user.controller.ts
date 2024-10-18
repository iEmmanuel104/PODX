import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import StreamIOConfig from '../clients/streamio.config';

export default class UserController {

    static async getAllUsers(req: AuthenticatedRequest, res: Response) {
        const { page, size, q, isBlocked, isDeactivated } = req.query;
        const queryParams: Record<string, unknown> = {};

        if (page && size) {
            queryParams.page = Number(page);
            queryParams.size = Number(size);
        }

        // Add filters for blocked and deactivated users
        if (isBlocked !== undefined) {
            queryParams.isBlocked = isBlocked === 'true';
        }

        if (isDeactivated !== undefined) {
            queryParams.isDeactivated = isDeactivated === 'true';
        }

        // Add search query if provided
        if (q) {
            queryParams.q = q as string;
        }

        const users = await UserService.viewUsers(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Users retrieved successfully',
            data: { ...users },
        });
    }

    static async getUser(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;

        const user = await UserService.viewSingleUser(id as string);

        res.status(200).json({
            status: 'success',
            message: 'User retrieved successfully',
            data: user,
        });
    }

    static async updateUser(req: AuthenticatedRequest, res: Response) {
        const { username, displayImage, isDeactivated } = req.body;

        // eslint-disable-next-line no-undef
        const file = req.file as Express.Multer.File | undefined;
        let url;
        if (file) {
            const result = await CloudinaryClientConfig.uploadtoCloudinary({
                fileBuffer: file.buffer,
                id: req.user.id,
                name: file.originalname,
                type: 'image',
            });
            url = result.url as string;
        } else if (displayImage) {
            url = displayImage;
        }

        // Prepare the update data for the user profile
        const updateData = {
            ...(username && { username }),
            ...(url && { displayImage: url }),
        };

        // Only update settings if isDeactivated is provided in the request body
        let settingsData = {};
        if (isDeactivated !== undefined && isDeactivated === 'true') {
            const state: boolean = isDeactivated === 'true';
            settingsData = {
                ...(req.user.settings && state === req.user.settings.isDeactivated ? {} : { isDeactivated: state }),
            };
        }

        const dataKeys = Object.keys(updateData);
        const settingsKeys = Object.keys(settingsData);

        if (dataKeys.length === 0 && settingsKeys.length === 0) {
            throw new BadRequestError('No new data to update');
        }

        // Update user settings if necessary
        if (settingsKeys.length > 0) {
            await UserService.updateUserSettings(req.user.id, settingsData);
        }

        // Update user profile data if necessary
        const updatedUser = dataKeys.length > 0
            ? await UserService.updateUser(req.user.id, updateData)
            : req.user;

        await StreamIOConfig.updateUser(updatedUser);

        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: updatedUser,
        });
    }

    static async findOrCreateUser(req: Request, res: Response) {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            throw new BadRequestError('Wallet address is required');
        }

        let user = await UserService.viewSingleUserByWalletAddress(walletAddress);

        if (!user) {
            // Create a new user
            const username = `guest-${walletAddress.slice(0, 4)}`;
            user = await UserService.addUser({ walletAddress, username });
        }

        const streamToken = await StreamIOConfig.generateToken(user.id);

        // Convert Mongoose document to a plain JavaScript object
        const userObject = user.toObject();

        // Remove any fields you don't want to send to the client
        delete userObject.__v;

        console.log({ user: userObject, streamToken });

        res.status(200).json({
            status: 'success',
            message: userObject.username.startsWith('guest-') ? 'New user created' : 'Existing user found',
            data: {
                ...userObject,
                streamToken,
            },
        });
    }
}
