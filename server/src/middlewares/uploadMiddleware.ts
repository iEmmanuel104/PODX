/* eslint-disable no-unused-vars */
import Multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../utils/customErrors';

export enum UploadType {
    Single = 'single',
    Array = 'array',
    Fields = 'fields'
}

// eslint-disable-next-line no-undef
const fileFilter = (req: Request, file: Express.Multer.File, cb: Multer.FileFilterCallback): void => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    const allowedVideoTypes = ['video/x-flv', 'video/x-matroska', 'video/quicktime', 'video/mp4'];
    const allowedAudioTypes = ['audio/mpeg'];

    if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else if (allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else if (allowedAudioTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        let fileType = 'file';
        if (file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
            fileType = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
        }
        const supportedTypes = `Supported ${fileType} types are: ${fileType === 'image'
            ? allowedImageTypes.join(', ')
            : fileType === 'video'
                ? allowedVideoTypes.join(', ')
                : allowedAudioTypes.join(', ')
        }`;
        cb(new BadRequestError(`Unsupported ${fileType} type. ${supportedTypes}`));
    }
};

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 300 }, // set max file size to 300 MB
    fileFilter: fileFilter,
});

export const uploadMiddleware = function (type: UploadType, nameOrFields: string | Multer.Field[], maxCount?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log('uploadMiddleware triggered');

        
        let multerMiddleware;

        switch (type) {
        case UploadType.Single:
            multerMiddleware = multer.single(nameOrFields as string);
            break;
        case UploadType.Array:
            multerMiddleware = multer.array(nameOrFields as string, maxCount);
            break;
        case UploadType.Fields:
            multerMiddleware = multer.fields(nameOrFields as Multer.Field[]);
            break;
        default:
            throw new Error('Invalid upload type specified');
        }
            
        if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0) || Object.keys(req.files).length === 0)) {
            console.log('No file uploaded, proceeding to next middleware');
        } else {
            console.log('File uploaded, proceeding to multer middleware');
        }
    
            
        multerMiddleware(req, res, (err) => {
            if (err) {
                return next(err);
            }
            console.log('Multer middleware completed, proceeding to next middleware');
            next();
        });
    };
};
