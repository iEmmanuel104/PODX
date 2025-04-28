import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { CallService } from "../services/call.service";
import { BadRequestError } from "../utils/customErrors";

export default class Huddle01Controller {
    static generateAccessToken(req: AuthenticatedRequest, res: Response): void {
        const { roomId } = req.params;

        if (!roomId) {
            throw new BadRequestError("Room ID is required");
        }

        const { token } = CallService.generateAccessToken(
            roomId,
            req.user.id,
            // req.user.walletAddress,
        );

        res.status(200).json({
            status: "success",
            message: "Access token generated",
            data: { token },
        });
    }
}
