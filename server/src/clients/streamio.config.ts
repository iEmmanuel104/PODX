import { StreamClient } from '@stream-io/node-sdk';
import { STREAM_API_KEY, STREAM_API_SECRET } from '../utils/constants';
import { IUser } from '../models/Mongodb/user.model';
import { redisClient } from '../utils/redis';

export default class StreamIOConfig {
    private static client: StreamClient;

    static initialize(): void {
        if (!this.client) {
            this.client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
        }
    }

    static async createUser(user: IUser): Promise<{ message: string; error?: Error }> {
        try {
            this.initialize();
            const response = await this.client.upsertUsers([
                {
                    id: user.id,
                    name: user.username,
                    image: user.displayImage,
                    custom: {
                        walletAddress: user.walletAddress,
                    },
                },
            ]);

            // console.log('Streamio User created successfully:', response);
            return { message: 'User created successfully' };
        } catch (error) {
            console.error('Error creating user:', error);
            return { message: 'Error creating user', error: error as Error };
        }
    }

    // static async deleteUser(userId: string): Promise<{ message: string; error?: any }> {
    //     try {
    //         this.initialize();
    //         await this.client.deleteUser(userId);
    //         return { message: 'User deleted successfully' };
    //     } catch (error) {
    //         console.error('Error deleting user:', error);
    //         return { message: 'Error deleting user', error };
    //     }
    // }

    static async generateToken(userId: string): Promise<string> {
        const validity = 24 * 60 * 60;

        this.initialize();
        // // validity is optional, in this case we set it to 1 day
        // return this.client.generateUserToken({ user_id: userId, validity_in_seconds: validity });
        const newToken = this.client.generateUserToken({ user_id: userId, validity_in_seconds: validity });
        await redisClient.set(`stream_token_${userId}`, newToken);
        
        return newToken;
    }

    static async updateUser(user: IUser): Promise<{ message: string; error?: Error }> {
        try {
            this.initialize();
            const response = await this.client.updateUsersPartial({
                users: [
                    {
                        id: user.id,
                        set: {
                            name: user.username,
                            // image: user.displayImage,
                        },

                    },
                ],
            });

            // console.log('Streamio User updated successfully:', response);
            
            return { message: 'User updated successfully' };
        } catch (error) {
            console.error('Error updating user:', error);
            return { message: 'Error updating user', error: error as Error };
        }
    }

    // static async queryUsers(query: { [key: string]: string }): Promise<{ users: any[]; error?: any }> {
    //     try {
    //         this.initialize();
    //         const { users } = await this.client.queryUsers(query);
    //         return { users };
    //     } catch (error) {
    //         console.error('Error querying users:', error);
    //         return { users: [], error };
    //     }
    // }
}