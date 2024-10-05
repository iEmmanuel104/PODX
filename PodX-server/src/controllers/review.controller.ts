import { Request, Response } from 'express';
import ReviewService from '../services/review.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { IReview } from '../models/review.model';
import { BadRequestError } from '../utils/customErrors';

export default class ReviewController {
    static async addReview(req: AuthenticatedRequest, res: Response) {
        const { comment, rating, propertyId } = req.body;
        // Ensure rating is an integer between 1 and 5
        const parseRating = parseInt(rating, 10);
        if (isNaN(parseRating) || parseRating < 1 || parseRating > 5) {
            throw new BadRequestError('Rating must be an integer between 1 and 5');
        }

        const reviewData = {
            comment,
            rating: parseRating,
            propertyId,
            reviewerId: req.user.id,
        };
        const newReview = await ReviewService.addReview(reviewData as IReview);
        res.status(201).json({
            status: 'success',
            message: 'Review added successfully',
            data: newReview,
        });
    }

    static async deleteReview(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query;
        await ReviewService.deleteReview(id as string);
        res.status(200).json({
            status: 'success',
            message: 'Review deleted successfully',
            data: null,
        });
    }

    static async viewReview(req: Request, res: Response) {
        const { id } = req.query;
        if (!id) {
            throw new BadRequestError('Review ID is required');
        }

        const review = await ReviewService.viewReview(id as string);
        res.status(200).json({
            status: 'success',
            message: 'Review retrieved successfully',
            data: review,
        });
    }

    static async viewReviewsByProperty(req: Request, res: Response) {
        const { propertyId } = req.query;

        if (!propertyId) {
            throw new BadRequestError('Property ID is required');
        }

        const reviews = await ReviewService.viewReviewsByProperty(propertyId as string);
        res.status(200).json({
            status: 'success',
            message: 'Reviews retrieved successfully',
            data: reviews,
        });
    }

    static async viewReviewsByUser(req: Request, res: Response) {
        const { userId, propertyId } = req.query;

        const checkUser = userId ? userId as string : (req as AuthenticatedRequest).user.id;
        const reviews = await ReviewService.viewReviewsByUser(checkUser, propertyId as string);
        res.status(200).json({
            status: 'success',
            message: 'Reviews retrieved successfully',
            data: reviews,
        });
    }
}
