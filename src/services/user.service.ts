/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import { User, IUser } from '../models/Mongodb/user.model';
import { UserSettings, IUserSettings } from '../models/Mongodb/userSettings.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import { ICallActivity, IStreakStats, UserStreak } from '../models/Mongodb/userStreak.model';
import { Call, ICall } from '../models/Mongodb/call.model';

export interface IViewUsersQuery {
    page?: number;
    size?: number;
    q?: string;
    isBlocked?: boolean;
    isDeactivated?: boolean;
}

export interface IDynamicQueryOptions {
    query: Record<string, string>;
    includes?: 'profile' | 'all';
    attributes?: string[];
}

export interface ITransformedUserResponse {
    id: string;
    username: string;
    walletAddress: string;
    displayImage?: string;
    settings?: IUserSettings;
    streak: {
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
        stats?: IStreakStats;
        recentActivities?: ICallActivity[];
        streakHistory?: Array<{ date: Date; streak: number }>;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

export default class UserService {

    static async isWalletAddressEmailAndUserNameAvailable(walletAddress: string, username: string): Promise<boolean> {
        const existingUser = await User.findOne({
            $or: [
                { walletAddress },
                { username },
            ],
        });

        if (existingUser) {
            const conflicts: string[] = [];
            if (existingUser.walletAddress === walletAddress) {
                conflicts.push('wallet address');
            }
            if (existingUser.username === username) {
                conflicts.push('username');
            }

            const conflictList = conflicts.join(', ');
            throw new BadRequestError(`${conflictList} provided ${conflicts.length > 1 ? 'are' : 'is'} already in use`);
        }

        return true;
    }

    static async isWalletAddressAvailable(walletAddress: string): Promise<boolean> {
        const existingUser = await User.findOne({ walletAddress });

        if (existingUser) {
            throw new BadRequestError('Wallet address already in use');
        }

        return true;
    }

    static async addUser(userData: Partial<IUser>): Promise<IUser> {
        const user = await User.create(userData);

        await UserSettings.create({
            userId: user._id,
            joinDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd format
        } as IUserSettings);

        return user;
    }

    static async viewUsers(queryData?: IViewUsersQuery): Promise<{
        users: ITransformedUserResponse[],
        count: number,
        totalPages?: number
    }> {
        const { page, size, q: query, isBlocked, isDeactivated } = queryData || {};

        const filter: Record<string, any> = {};

        if (query) {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
                { walletAddress: { $regex: query, $options: 'i' } },
            ];
        }

        if (isBlocked !== undefined || isDeactivated !== undefined) {
            const settingsQuery = await UserSettings.find({
                ...(isBlocked !== undefined && { isBlocked }),
                ...(isDeactivated !== undefined && { isDeactivated }),
            }).select('userId');

            filter._id = { $in: settingsQuery.map(s => s.userId) };
        }

        let userQuery = User.find(filter)
            .populate('settings')
            .populate({
                path: 'streak',
                select: 'currentStreak longestStreak totalPoints stats weeklyActivity',
            });

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            userQuery = userQuery.skip(offset ?? 0).limit(limit ?? 0);
        }

        const [users, count] = await Promise.all([
            userQuery.lean().exec(),
            User.countDocuments(filter),
        ]);

        const transformedUsers: ITransformedUserResponse[] = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage,
            settings: user.settings,
            streak: user.streak ? {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                totalPoints: user.streak.totalPoints,
                stats: user.streak.stats,
            } : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        if (page && size) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { users: transformedUsers, count, ...totalPages };
        }

        return { users: transformedUsers, count };
    }

    static async viewSingleUser(id: string): Promise<ITransformedUserResponse> {
        const user = await User.findById(id)
            .populate('settings')
            .populate({
                path: 'streak',
                select: 'currentStreak longestStreak totalPoints stats streakHistory callActivities',
            })
            .lean()
            .exec();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return {
            id: user._id.toString(),
            username: user.username,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage,
            settings: user.settings,
            streak: user.streak ? {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                totalPoints: user.streak.totalPoints,
                stats: user.streak.stats,
                recentActivities: user.streak.callActivities?.slice(-5),
                streakHistory: user.streak.streakHistory?.slice(-30),
            } : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    static async viewSingleUserByWalletAddress(walletAddress: string): Promise<ITransformedUserResponse | null> {
        const user = await User.findOne({ walletAddress })
            // .populate('settings')
            .populate({
                path: 'streak',
                select: 'currentStreak longestStreak totalPoints',
                // select: 'currentStreak longestStreak totalPoints stats',
            })
            .lean()
            .exec();

        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            username: user.username,
            walletAddress: user.walletAddress,
            displayImage: user.displayImage,
            // settings: user.settings,
            streak: user.streak ? {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                totalPoints: user.streak.totalPoints,
                // stats: user.streak.stats,
            } : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    static async viewSingleUserByWalletAddressWithoutStreak(walletAddress: string): Promise<IUser | null> {
        return User.findOne({ walletAddress });
    }

    static async viewSingleUserByEmail(email: string): Promise<IUser> {
        const user = await User.findOne({ email }).select('id firstName status');

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserDynamic(queryOptions: IDynamicQueryOptions): Promise<IUser> {
        const { query, attributes } = queryOptions;

        let userQuery = User.findOne(query);

        if (attributes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userQuery = userQuery.select(attributes.join(' ')) as any;
        }

        const user = await userQuery.populate('settings');

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async updateUser(userId: string, dataToUpdate: Partial<IUser>): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, dataToUpdate, { new: true });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async updateUserSettings(userId: string, dataToUpdate: Partial<IUserSettings>): Promise<IUserSettings> {
        const userSettings = await UserSettings.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            dataToUpdate,
            { new: true }
        );

        if (!userSettings) {
            throw new NotFoundError('Oops User settings not found');
        }

        return userSettings;
    }

    static async deleteUser(userId: string): Promise<void> {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        await UserSettings.deleteOne({ userId: new Types.ObjectId(userId) });
    }

    static async getUserStreakStats(userId: string): Promise<{
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
        recentActivities: Array<{
            date: Date;
            duration: number;
            points: number;
        }>;
        streakHistory: Array<{
            date: Date;
            streak: number;
        }>;
    }> {
        const userStreak = await UserStreak.findOne({ userId: new Types.ObjectId(userId) });
        if (!userStreak) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                totalPoints: 0,
                recentActivities: [],
                streakHistory: [],
            };
        }

        return {
            currentStreak: userStreak.currentStreak,
            longestStreak: userStreak.longestStreak,
            totalPoints: userStreak.totalPoints,
            recentActivities: userStreak.callActivities
                .slice(-5)
                .map(activity => ({
                    date: activity.date,
                    duration: activity.duration,
                    points: activity.points,
                })),
            streakHistory: userStreak.streakHistory.slice(-30), // Last 30 days
        };
    }

    static async getUserCallsFromDb(
        walletAddress: string,
        filter?: 'creator' | 'member' | 'tokengate'
    ): Promise<ICall[]> {
        try {
            // First, get the user's ID from their wallet address
            const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            if (!user) {
                throw new Error('User not found');
            }

            let query: any = {};

            switch (filter) {
            case 'creator':
                query = { createdById: user._id };
                break;
            case 'member':
                query = {
                    'members.userId': user._id,
                    createdById: { $ne: user._id }, // Exclude calls where user is creator
                };
                break;
            case 'tokengate':
                query = {
                    createdById: user._id,
                    // Check if members array has more than 1 member
                    $expr: {
                        $gt: [{ $size: '$members' }, 1],
                    },
                };
                break;
            default:
                // If no filter, get both created and member calls
                query = {
                    $or: [
                        { createdById: user._id },
                        { 'members.userId': user._id },
                    ],
                };
            }

            const calls = await Call.find(query)
                .populate('createdById', 'walletAddress username displayImage')
                .populate('members.userId', 'walletAddress username displayImage')
                .sort({ createdAt: -1 }); // Most recent first

            return calls;
        } catch (error) {
            console.error('Error getting user calls:', error);
            throw error;
        }
    }

    /**
     * Find a user by their wallet address
     * @param walletAddress The wallet address to search for
     * @returns The user if found, null otherwise
     */
    static async findUserByWalletAddress(walletAddress: string): Promise<ITransformedUserResponse | null> {
        try {
            // Normalize the wallet address (convert to lowercase)
            const normalizedAddress = walletAddress.toLowerCase();

            // Find the user by wallet address
            const user = await User.findOne({ walletAddress: normalizedAddress })
                .populate('settings')
                .populate({
                    path: 'streak',
                    select: 'currentStreak longestStreak totalPoints stats weeklyActivity',
                });

            if (!user) {
                return null;
            }

            // Transform the user object
            return {
                id: (user._id as any).toString(),
                username: user.username,
                walletAddress: user.walletAddress,
                displayImage: user.displayImage,
                settings: user.settings,
                streak: user.streak ? {
                    currentStreak: user.streak.currentStreak,
                    longestStreak: user.streak.longestStreak,
                    totalPoints: user.streak.totalPoints,
                    stats: user.streak.stats,
                } : null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        } catch (error) {
            console.error('Error finding user by wallet address:', error);
            throw error;
        }
    }
}