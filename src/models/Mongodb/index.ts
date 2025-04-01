import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { MONGODB_URI } from '../../utils/constants';

export async function initiateMongoDB(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI, { retryWrites: true, w: 'majority' });
        logger.info('MongoDB connection established successfully');
    } catch (error) {
        logger.error('Unable to connect to MongoDB:', error);
        throw error;
    }
}