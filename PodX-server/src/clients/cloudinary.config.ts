/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_API_SECRET, CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from '../utils/constants';
export type uploadType = {
    message: string;
    url?: string;
    error?: any;
};
export default class CloudinaryClientConfig {
    static async uploadtoCloudinary({ fileBuffer, id, name, type }: { fileBuffer: Buffer, id: string, name: string, type: string }): Promise<uploadType> {
        try {
            cloudinary.config({
                cloud_name: CLOUDINARY_CLOUD_NAME,
                api_key: CLOUDINARY_API_KEY,
                api_secret: CLOUDINARY_API_SECRET,
            });
            const options = {
                use_filename: true,
                folder: `Shortlet-Lagos/${type}/${id}`,
                public_id: name,
            };

            const result: uploadType = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(options, (error, result) => {
                        if (error) {
                            console.log('error from uploads ::::::::: ', error);
                            reject(error);
                        } else {
                            console.log('result from upload :::::::: ', result);
                            resolve({ message: 'success', url: result?.secure_url });
                        }
                    })
                    .end(fileBuffer);
            });

            return result;
        } catch (error) {
            console.log(error);
            return { message: 'error', error };
        }
    }

    static async deleteFromCloudinary(secureUrl: string): Promise<{ message: string; error?: any }> {
        try {
            cloudinary.config({
                cloud_name: CLOUDINARY_CLOUD_NAME,
                api_key: CLOUDINARY_API_KEY,
                api_secret: CLOUDINARY_API_SECRET,
            });

            // Extract the public ID from the secure URL
            const urlParts = secureUrl.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = publicIdWithExtension.split('.')[0];

            const result = await new Promise<{ result: string }>((resolve, reject) => {
                cloudinary.uploader.destroy(publicId, (error, result) => {
                    if (error) {
                        console.log('Error deleting file from Cloudinary:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            if (result.result === 'ok') {
                return { message: 'File deleted successfully' };
            } else {
                return { message: 'File deletion failed', error: result };
            }
        } catch (error) {
            console.log('Error in deleteFromCloudinary:', error);
            return { message: 'error', error };
        }
    }

}