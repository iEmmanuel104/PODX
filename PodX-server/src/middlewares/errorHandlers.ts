/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { CustomAPIError } from '../utils/customErrors';
import { logger } from '../utils/logger';

class Middlewares {
    static errorHandler(err: Error | any, req: Request, res: Response, next: NextFunction ): Response {
        logger.error('Error handler');
        logger.error(err);
        console.log(err);
        
        const customError = {
            // set default
            status: 'error',
            error: true,
            statusCode: err.statusCode || 500,
            message: err.message || 'Ops, Something went wrong',
        };

        if (err instanceof CustomAPIError && err.statusCode !== 500) {
            customError.statusCode = err.statusCode;
            customError.message = err.message;
        }

        // dev related errors for system monitoring //
        if (err.name === 'ValidationError') {
            customError.message = Object.values(err.errors)
                .map((item: any) => item.message)
                .join(',');
            customError.statusCode = 400;
        }
        if (err.code && err.code === 11000) {
            customError.message = `Duplicate value entered for ${Object.keys(
                err.keyValue
            )} field, please choose another value`;
            customError.statusCode = 400;
        }
        if (err.name === 'CastError') {
            customError.message = `No item found with id : ${err.value}`;
            customError.statusCode = 404;
        }
        // for sequelize errors
        if (err.name === 'SequelizeValidationError') {
            customError.message = Object.values(err.errors)
                .map((item: any) => item.message)
                .join(',');
            customError.statusCode = 400;
        }
        if (err.name === 'SequelizeUniqueConstraintError') {
            customError.message = Object.values(err.errors)
                .map((item: any) => item.message)
                .join(',');
            customError.statusCode = 400;
        }
        if (err.name === 'SequelizeDatabaseError') {
            customError.message = err.message;
            customError.statusCode = 400;
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            customError.message = err.parent.detail;
            customError.statusCode = 400;
        }

        // end of  block for dev related errors //


        // if the error is not one of the specific types above, return a generic internal server error
        if (customError.statusCode === 500) {
            return res.status(500).json({ status: 'error', error: true, message: 'Ops, Something went wrong' });
        }

        return res.status(customError.statusCode).json({
            status: customError.status,
            error: customError.error,
            message: customError.message,
        });
        
    }

    static notFound(req: Request, res: Response): Response {
        return res.status(404).json({
            status: 'error',
            error: true,
            message: 'Route does not Exist',
        });
    }
}

export default Middlewares;
