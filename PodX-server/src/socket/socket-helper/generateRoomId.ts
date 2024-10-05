import crypto from 'crypto';

export function generateRoomId(): string {
    return crypto.randomBytes(8).toString('hex');
}