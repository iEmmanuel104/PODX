import { Types } from 'mongoose';
import { User, IUser } from '../models/Mongodb/user.model';
import { UserSettings, IUserSettings } from '../models/Mongodb/userSettings.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

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

    static async viewUsers(queryData?: IViewUsersQuery): Promise<{ users: IUser[], count: number, totalPages?: number }> {
        const { page, size, q: query, isBlocked, isDeactivated } = queryData || {};

        const filter: Record<string, string | unknown> = {};
        const settingsFilter: Record<string, boolean> = {};

        if (query) {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
            ];
        }

        if (isBlocked !== undefined) {
            settingsFilter.isBlocked = isBlocked;
        }

        if (isDeactivated !== undefined) {
            settingsFilter.isDeactivated = isDeactivated;
        }

        let userQuery = User.find(filter).populate({
            path: 'settings',
            match: settingsFilter,
            select: 'joinDate isBlocked isDeactivated lastLogin meta',
        });

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            userQuery = userQuery.skip(offset ?? 0).limit(limit ?? 0);
        }

        const users = await userQuery.exec();
        const count = await User.countDocuments(filter);

        if (page && size && users.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { users, count, ...totalPages };
        } else {
            return { users, count };
        }
    }

    static async viewSingleUser(id: string): Promise<IUser> {
        const user = await User.findById(id).populate<{ settings: IUserSettings }>('settings');

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserByWalletAddress(walletAddress: string): Promise<IUser | null> {
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
            userQuery = userQuery.select(attributes.join(' '));
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
}