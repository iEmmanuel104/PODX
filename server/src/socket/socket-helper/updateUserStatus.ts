// src/socket/socket-helper/updateUserStatus.ts
import UserService from '../../services/user.service';
import { logger } from '../../utils/logger';

export async function updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
        await UserService.updateUserSettings(userId, { 'settings.online': isOnline });
    } catch (error) {
        logger.error(`Error updating online status for user ${userId}:`, error);
    }
}