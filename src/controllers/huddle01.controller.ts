import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CallService } from '../services/call.service';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/customErrors';

export default class Huddle01Controller {
    static async generateAccessToken(req: AuthenticatedRequest, res: Response) {
        try {
            const { roomId } = req.params;
      
            if (!roomId) {
                throw new BadRequestError('Room ID is required');
            }
      
            const { token } = await CallService.generateAccessToken(
                roomId,
                req.user.id,
                req.user.walletAddress
            );
      
            res.status(200).json({
                status: 'success',
                message: 'Access token generated',
                data: { token },
            });
      
        } catch (error) {
            logger.error('Error generating access token:', error);
      
            if (error instanceof BadRequestError) {
                res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to generate access token',
                });
            }
        }
    }
} 