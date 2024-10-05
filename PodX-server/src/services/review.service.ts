import { Transaction } from 'sequelize';
import Review, { IReview } from '../models/review.model';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import User from '../models/Postgres/user.model';

export default class ReviewService {
    static async addReview(reviewData: IReview): Promise<Review> {

        // check for existing review
        const existingReview = await Review.findOne({
            where: {
                propertyId: reviewData.propertyId,
                reviewerId: reviewData.reviewerId,
            },
        });
        if (existingReview) {
            throw new BadRequestError('You have already reviewed this property');
        }

        const newReview = await Review.create({ ...reviewData });
        return newReview;
    }

    static async deleteReview(reviewId: string, transaction?: Transaction): Promise<void> {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            throw new NotFoundError('Review not found');
        }
        transaction ? await review.destroy({ transaction }) : await review.destroy();
    }

    static async viewReview(reviewId: string): Promise<Review> {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            throw new NotFoundError('Review not found');
        }
        return review;
    }

    static async viewReviewsByProperty(propertyId: string): Promise<Review[]> {
        const reviews = await Review.findAll({
            where: { propertyId },
            include: [{
                model: User,
                as: 'reviewer',
                attributes: ['id', 'firstName', 'lastName', 'username', 'displayImage', 'email'],
            }],
        });
        return reviews;
    }

    static async viewReviewsByUser(userId: string, propertyId?: string): Promise<Review[]> {
        const reviews = await Review.findAll({
            where: {
                reviewerId: userId,
                ...(propertyId && { propertyId }),
            },
        });
        return reviews;
    }
}
