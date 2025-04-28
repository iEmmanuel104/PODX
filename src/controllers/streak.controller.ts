import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { StreakService } from "../services/streak.service";
import { BadRequestError } from "../utils/customErrors";

export class StreakController {
    static async recalculateUserStreak(
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<void> {
        await StreakService.updateUserStreakStats(req.user.id);

        res.status(200).json({
            status: "success",
            message: "User streak recalculated successfully",
        });
    }

    static async syncStreaksWithStreamIO(
        req: Request,
        res: Response,
    ): Promise<void> {
        const summary = await StreakService.syncStreaksWithStreamIO();

        res.status(200).json({
            status: "success",
            message: "Streaks synchronized with StreamIO successfully",
            data: {
                summary,
                errors: summary.errors.length > 0 ? summary.errors : undefined,
            },
        });
    }

    static async recalculateAllStreaks(
        req: Request,
        res: Response,
    ): Promise<void> {
        const result = await StreakService.recalculateAllUserStreaks();

        res.status(200).json({
            status: "success",
            message: "All user streaks recalculated successfully",
            data: result,
        });
    }

    static async getLeaderboard(req: Request, res: Response): Promise<void> {
        const limit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : 10;

        if (isNaN(limit) || limit < 1) {
            throw new BadRequestError("Invalid limit parameter");
        }

        const leaderboard = await StreakService.getLeaderboard(limit);
        res.status(200).json({
            status: "success",
            data: leaderboard,
        });
    }
}
