import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import User, { IUser } from '../models/Postgres/user.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import { Sequelize } from '../models/Postgres';
import UserSettings, { IUserSettings } from '../models/Postgres/userSettings.model';

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
        // Construct where condition
        const whereCondition = {
            [Op.or]: [
                { walletAddress: walletAddress },
                { username: username },
            ],
        };

        // Find existing users with the given email, wallet address, or username
        const existingUsers = await User.findAll({
            where: whereCondition,
            attributes: ['walletAddress', 'username'],
        });

        // Check for conflicts and collect them
        const conflicts: string[] = [];
        for (const user of existingUsers) {
            if (user.walletAddress === walletAddress) {
                conflicts.push('wallet address');
            }
            if (user.username === username) {
                conflicts.push('username');
            }
        }

        // If conflicts found, throw a single error with all conflicts
        if (conflicts.length > 0) {
            const conflictList = conflicts.join(', ');
            throw new BadRequestError(`${conflictList} provided ${conflicts.length > 1 ? 'are' : 'is'} already in use`);
        }

        return true;
    }

    static async isWalletAddressAvailable(walletAddress: string): Promise<boolean> {
        const existingUser: User | null = await User.findOne({
            where: { walletAddress },
            attributes: ['walletAddress'],
        });

        if (existingUser) {
            throw new BadRequestError('Wallet address already in use');
        }

        return true;
    }

    static async addUser(userData: IUser): Promise<User> {

        const _transaction = await User.create({ ...userData });

        await UserSettings.create({
            userId: _transaction.id,
            joinDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd format
        } as IUserSettings);

        return _transaction;
    }

    static async viewUsers(queryData?: IViewUsersQuery): Promise<{ users: User[], count: number, totalPages?: number }> {
        const { page, size, q: query, isBlocked, isDeactivated } = queryData || {};

        const where: Record<string | symbol, unknown> = {};
        const settingsWhere: Record<string, unknown> = {};

        if (query) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${query}%` } },
                { lastName: { [Op.iLike]: `%${query}%` } },
                { username: { [Op.iLike]: `%${query}%` } },
                Sequelize.where(Sequelize.fn('concat', Sequelize.col('User.firstName'), ' ', Sequelize.col('User.lastName')), { [Op.iLike]: `%${query}%` }),
            ];
        }

        if (isBlocked !== undefined) {
            settingsWhere.isBlocked = isBlocked;
        }

        if (isDeactivated !== undefined) {
            settingsWhere.isDeactivated = isDeactivated;
        }

        const queryOptions: FindAndCountOptions<User> = {
            where,
            include: [
                {
                    model: UserSettings,
                    as: 'settings',
                    attributes: ['joinDate', 'isBlocked', 'isDeactivated', 'lastLogin', 'meta'],
                    where: settingsWhere,
                },
            ],
        };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: users, count } = await User.findAndCountAll(queryOptions);

        // Calculate the total count
        const totalCount = (count as unknown as []).length;

        if (page && size && users.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count: totalCount, limit: size } as IPaging);
            return { users, count: totalCount, ...totalPages };
        } else {
            return { users, count: totalCount };
        }
    }

    static async viewSingleUser(id: string): Promise<User> {
        const user: User | null = await User.scope('withSettings').findByPk(id);

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserByWalletAddress(walletAddress: string, transaction?: Transaction): Promise<User> {
        const user: User | null = await User.scope('withSettings').findOne({
            where: { walletAddress },
            transaction,
        });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserByEmail(email: string, transaction?: Transaction): Promise<User> {
        const user: User | null = await User.findOne({
            where: { email },
            attributes: ['id', 'firstName', 'status'],
            transaction,
        });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserDynamic(queryOptions: IDynamicQueryOptions): Promise<User> {
        const { query, attributes } = queryOptions;

        const user: User | null = await User.scope('withSettings').findOne({
            where: query,
            ...(attributes ? { attributes } : {}),
        });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async updateUser(user: User, dataToUpdate: Partial<IUser>): Promise<User> {
        await user.update(dataToUpdate);

        const updatedUser = await this.viewSingleUser(user.id);

        return updatedUser;
    }

    static async updateUserSettings(userId: string, dataToUpdate: Partial<IUserSettings>): Promise<UserSettings> {
        const userSettings = await UserSettings.findOne({ where: { userId } });
        if (!userSettings) {
            throw new NotFoundError('Oops User not found');
        }

        await userSettings.update(dataToUpdate);

        return userSettings;
    }

    static async deleteUser(user: User, transaction?: Transaction): Promise<void> {
        transaction ? await user.destroy({ transaction }) : await user.destroy();
    }

}