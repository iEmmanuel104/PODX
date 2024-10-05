import z from 'zod';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import { BadRequestError } from './customErrors';
import { v4 as uuidv4 } from 'uuid';
import { AWSUploadType } from './interface';

export interface IFileDataType {
    mimeType: string;
    fileName: string;
    fileSizeInBytes: number;
    durationInSeconds?: number;
}


export interface ProcessableFile  extends IFileDataType {
    originalName: string;
    extension: string; // Added as per the validator function
    uploadKey?: string; // This will be populated for successful uploads
    preSignedUrl?: string; // This will be populated for successful uploads
    identifier: string; // This will be populated for successful uploads
    uploadClass: AWSUploadType; // This will be populated for successful uploads
}

export interface UnprocessableFile {
    file: IFileDataType;
    reason: string;
}
class Validator {
    static isValidEmail(email: string): boolean {
        const emailSchema = z.string().email();
        return emailSchema.safeParse(email).success;
    }

    static isValidPhoneNumber(phoneNumber: string): boolean {
        const phoneRegex = /^\+?[0-9]{10,14}$/;
        const phoneSchema = z.string().refine(phone => phoneRegex.test(phone));
        return phoneSchema.safeParse(phoneNumber).success;
    }

    static isValidPassword(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$&*-^!])[a-zA-Z\d@#$&*-^!]{6,}$/;
        return passwordRegex.test(password);
    }

    static isValidMimeType(mimeType: string): boolean {
        const imageTypes = [
            'image/jpeg', 'image/jpg',
            'image/png', 'image/gif', 'image/webp', 'image/tiff',
            'image/bmp', 'image/vnd.microsoft.icon', 'image/svg+xml',
        ];
        const videoTypes = [
            'video/mp4', 'video/mpeg', 'video/ogg', 'video/webm', 'video/avi',
            'video/mov', 'video/flv', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv',
            'video/3gpp', 'video/3gpp2',
            'video/x-matroska',
        ];
        // Combining all MIME types into a single pattern
        const allTypes = [...imageTypes, ...videoTypes];
        const mimeTypeSchema = z.enum(allTypes as [string, ...string[]]);

        return mimeTypeSchema.safeParse(mimeType).success;
    }

    static isUUID(uuid: string): boolean {
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    }

    static isValidFilename(filename: string): { isValid: boolean, extension: string | null } {
        const parts = filename.split('.');
        const extension = parts.length > 1 ? `.${parts[parts.length - 1]}` : null;
        const isValid = extension !== null;
        return { isValid, extension };
    }

    static uploadFIleValidatorToGetExtension({ mimeType, fileName, fileSizeInBytes, durationInSeconds }: IFileDataType): string {
        const missingFields = [];
        if (!mimeType) missingFields.push('mimeType');
        if (!fileName) missingFields.push('fileName');
        if (!fileSizeInBytes) missingFields.push('fileSizeInBytes');
        if (!durationInSeconds && mimeType.includes('video/')) missingFields.push('durationInSeconds');
        if (missingFields.length > 0) {
            throw new BadRequestError(`Please provide ${missingFields.join(', ')} parameter(s)`);
        }

        const { isValid, extension } = this.isValidFilename(fileName);

        // check if filename has an extension
        if (!isValid) {
            throw new BadRequestError('Invalid file name, file name must have an extension');
        }

        const isMimeTypeValid = this.isValidMimeType(mimeType as string);

        if (!isMimeTypeValid) {
            throw new BadRequestError('unsupported file type');
        }

        // Video file validations
        if (isValid && mimeType.includes('video/')) {

            if ((durationInSeconds as number) > 300) {
                throw new BadRequestError('Video duration exceeds the 5 minute limit');
            }
        }

        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        if (fileSizeInMB > 50) {
            throw new BadRequestError('File size exceeds the 50MB limit');
        }

        return extension as string;

    }

    static validateMultipleFilesForUpload(files: IFileDataType[], uploadClass: AWSUploadType ): { processable: ProcessableFile[], unprocessible: UnprocessableFile[] } {
        const processable: ProcessableFile[] = [];
        const unprocessible: UnprocessableFile[] = [];

        // check if the length is more than 5
        if (files.length > 5) {
            throw new BadRequestError('You can only upload a maximum of 10 files at a time');
        }

        // generate unique id from uuid package
        const identifier = uuidv4();

        files.forEach(file => {
            const missingFields = [];
            if (!file.mimeType) missingFields.push('mimeType');
            if (!file.fileName) missingFields.push('fileName');
            if (!file.fileSizeInBytes) missingFields.push('fileSizeInBytes');
            if (!file.durationInSeconds && file.mimeType.includes('video/')) missingFields.push('durationInSeconds');

            if (missingFields.length > 0) {
                unprocessible.push({ file, reason: `Missing fields: ${missingFields.join(', ')}` });
                return;
            }

            const { isValid, extension } = Validator.isValidFilename(file.fileName);
            if (!isValid) {
                unprocessible.push({ file, reason: 'Invalid file name, must have an extension' });
                return;
            }

            const isMimeTypeValid = Validator.isValidMimeType(file.mimeType);
            if (!isMimeTypeValid) {
                unprocessible.push({ file, reason: 'Unsupported file type' });
                return;
            }

            if (file.mimeType.includes('video/') && (file.durationInSeconds) as number > 300) {
                unprocessible.push({ file, reason: 'Video duration exceeds the 5 minute limit' });
                return;
            }

            const fileSizeInMB = file.fileSizeInBytes / (1024 * 1024);
            if (fileSizeInMB > 50) {
                unprocessible.push({ file, reason: 'File size exceeds the 50MB limit' });
                return;
            }

            // If all validations pass
            processable.push({
                ...file,
                extension: extension as string,
                identifier,
                uploadClass,
                originalName: file.fileName,
            });
        });

        return { processable, unprocessible };
    }




}

export default Validator;