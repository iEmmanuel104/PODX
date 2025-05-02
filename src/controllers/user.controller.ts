import { Request, Response } from "express";
import UserService from "../services/user.service";
import { BadRequestError } from "../utils/customErrors";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AuthUtil } from "../utils/token";
import { logger } from "../utils/logger";
// import { TipService } from '../services/tip.service';

export default class UserController {
    static async getAllUsers(
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<void> {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            throw new BadRequestError("Wallet address is required");
        }

        // Find user by wallet address
        const user = await UserService.findUserByWalletAddress(
            walletAddress as string,
        );

        if (!user) {
            throw new BadRequestError("User not found");
        }

        res.status(200).json({
            status: "success",
            message: "User retrieved successfully",
            data: user,
        });
    }

    static async updateUser(
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<void> {
        const { username, isDeactivated } = req.body;

        // Prepare the update data for the user profile
        const updateData = {
            ...(username && { username }),
        };

        // Only update settings if isDeactivated is provided in the request body
        let settingsData = {};
        if (isDeactivated !== undefined && isDeactivated === "true") {
            const state: boolean = isDeactivated === "true";
            settingsData = {
                ...(req.user.settings &&
                state === req.user.settings.isDeactivated
                    ? {}
                    : { isDeactivated: state }),
            };
        }

        const dataKeys = Object.keys(updateData);
        const settingsKeys = Object.keys(settingsData);

        if (dataKeys.length === 0 && settingsKeys.length === 0) {
            throw new BadRequestError("No new data to update");
        }

        // Update user settings if necessary
        if (settingsKeys.length > 0) {
            await UserService.updateUserSettings(req.user.id, settingsData);
        }

        // Update user profile data if necessary
        const updatedUser =
            dataKeys.length > 0
                ? await UserService.updateUser(req.user.id, updateData)
                : req.user;

        // Format the response with only the required fields
        const responseData = {
            walletAddress: updatedUser.walletAddress,
            username: updatedUser.username,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            id: updatedUser.id,
        };

        res.status(200).json({
            status: "success",
            message: "User updated successfully",
            data: responseData,
        });
    }

    static async validateUser(req: Request, res: Response): Promise<void> {
        const { walletAddress, hash } = req.body;

        if (!walletAddress) {
            throw new BadRequestError("Wallet address is required");
        }

        let userData =
            await UserService.viewSingleUserByWalletAddress(walletAddress);
        let firstTimeUser = false;

        if (!userData) {
            // Create a new user
            const username = `guest-${walletAddress.slice(0, 8)}`;
            await UserService.addUser({ walletAddress, username });
            // Fetch the complete user data after creation
            userData =
                await UserService.viewSingleUserByWalletAddress(walletAddress);
            if (!userData) {
                throw new Error("Failed to retrieve user data after creation");
            }
            firstTimeUser = true;
        }

        let signature = undefined;

        if (hash === true) {
            // Generate a new auth token with a unique hash
            signature = AuthUtil.generateTokenWithHash({
                type: "access",
                user: {
                    id: userData.id,
                    walletAddress: userData.walletAddress,
                },
            });
        }

        logger.info("user data retrieved for:", userData.username);

        res.status(200).json({
            status: "success",
            message: firstTimeUser ? "New user created" : "Existing user found",
            data: {
                ...userData,
                firstTimeUser,
                signature,
            },
        });
    }
}
