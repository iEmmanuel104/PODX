import crypto from 'node:crypto';

export default class HelperUtils {
    static generateRandomString = (length: number): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, characters.length);
            randomString += characters.charAt(randomIndex);
        }

        return randomString;
    };
}