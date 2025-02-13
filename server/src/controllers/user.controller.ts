import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { BadRequestError } from '../utils/customErrors';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import StreamIOConfig from '../clients/streamio.config';
import { AuthUtil } from '../utils/token';

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
            data: users,
        });
    }

    static async getUser(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;

        if (!id) {
            throw new BadRequestError('User ID is required');
        }

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

    static async validateUser(req: Request, res: Response) {
        const { walletAddress, hash } = req.body;

        if (!walletAddress) {
            throw new BadRequestError('Wallet address is required');
        }

        let userData = await UserService.viewSingleUserByWalletAddress(walletAddress);
        let firstTimeUser = false;

        if (!userData) {
            // Create a new user
            const username = `guest-${walletAddress.slice(0, 8)}`;
            await UserService.addUser({ walletAddress, username });
            // Fetch the complete user data after creation
            userData = await UserService.viewSingleUserByWalletAddress(walletAddress);
            if (!userData) {
                throw new Error('Failed to retrieve user data after creation');
            }
            firstTimeUser = true;
        }

        const streamToken = await StreamIOConfig.generateToken(userData.id);

        let signature = undefined;

        if (hash === 'true') {
            // Generate a new auth token with a unique hash
            signature = await AuthUtil.generateTokenWithHash({
                type: 'access',
                user: {
                    id: userData.id,
                    walletAddress: userData.walletAddress,
                },
            });
        }

        console.log('user data retrieved for: ', userData.username);

        res.status(200).json({
            status: 'success',
            message: firstTimeUser ? 'New user created' : 'Existing user found',
            data: {
                ...userData,
                streamToken,
                signature,
                firstTimeUser,
            },
        });
    }

    static async getUserStreakStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const stats = await UserService.getUserStreakStats(req.user.id);
            res.status(200).json({
                status: 'success',
                data: stats,
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching user statistics',
            });
        }
    }

    static async getUserCalls(req: AuthenticatedRequest, res: Response) {
        const { calls, error } = await StreamIOConfig.getCallsByUser(req.user.id);

        if (error) {
            throw new BadRequestError(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'User calls retrieved successfully',
            data: { calls },
        });
    }

    static async getUserCallsLocal(req: AuthenticatedRequest, res: Response) {
        try {
            const { filter } = req.query;

            // Validate filter if provided
            if (filter && !['creator', 'member'].includes(filter as string)) {
                throw new BadRequestError('Invalid filter value. Must be either "creator" or "member"');
            }

            const calls = await UserService.getUserCallsFromDb(
                req.user.walletAddress,
                filter as 'creator' | 'member' | undefined
            );

            res.status(200).json({
                status: 'success',
                message: 'User calls retrieved successfully',
                data: {
                    calls,
                    total: calls.length,
                    filter: filter || 'all',
                },
            });
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            console.error('Error retrieving user calls:', error);
            throw new BadRequestError('Failed to retrieve user calls');
        }
    }
}
