import { Transaction, Op, FindAndCountOptions, Includeable, WhereOptions } from 'sequelize';
import User, { IUser } from '../models/Postgres/user.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import Validator from '../utils/validators';
import Pagination, { IPaging } from '../utils/pagination';
import { Sequelize } from '../models/Postgres';
import UserSettings, { IUserSettings } from '../models/userSettings.model';
import VerificationDoc, { DocType, IVerificationDoc, VerificationStatus } from '../models/verificationDocs.model';
import WithdrawalRequest, { IWithdrawalRequest, WithdrawalStatus } from '../models/Postgres/withdrawalRequest.model';
import Referral, { IReferral, ReferralStatus } from '../models/referral.model';


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

export interface IViewVerificationDocsQuery {
    page?: number;
    size?: number;
    userId?: string;
    type?: DocType;
    status?: VerificationStatus;
}

export interface IViewWithdrawalRequestsQuery {
    page?: number;
    size?: number;
    userId?: string;
    status?: WithdrawalStatus;
    minAmount?: number;
    maxAmount?: number;
}

export interface IViewReferralsQuery {
    page?: number;
    size?: number;
    refereeId?: string;
    referredId?: string;
    status?: ReferralStatus;
}


export default class UserService {

    static async isWalletAddressEmailAndUserNameAvailable(walletAddress: string, email: string, username: string): Promise<boolean> {
        // Validate email
        if (!Validator.isValidEmail(email)) {
            throw new BadRequestError('Invalid email');
        }

        // Construct where condition
        const whereCondition = {
            [Op.or]: [
                { email: email },
                { walletAddress: walletAddress },
                { username: username },
            ],
        };

        // Find existing users with the given email, wallet address, or username
        const existingUsers = await User.findAll({
            where: whereCondition,
            attributes: ['email', 'walletAddress', 'username'],
        });

        // Check for conflicts and collect them
        const conflicts: string[] = [];
        for (const user of existingUsers) {
            if (user.email === email) {
                conflicts.push('email');
            }
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
                { email: { [Op.iLike]: `%${query}%` } },
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



    static async addVerificationDoc(docData: IVerificationDoc, transaction?: Transaction): Promise<VerificationDoc> {
        const newDoc = await VerificationDoc.create({ ...docData }, { transaction });
        return newDoc;
    }

    static async updateVerificationDoc(doc: VerificationDoc, dataToUpdate: Partial<IVerificationDoc>): Promise<VerificationDoc> {
        await doc.update(dataToUpdate);
        const updatedDoc = await this.viewVerificationDoc(doc.id);
        return updatedDoc;
    }

    static async deleteVerificationDoc(doc: VerificationDoc, transaction?: Transaction): Promise<void> {
        transaction ? await doc.destroy({ transaction }) : await doc.destroy();
    }

    static async viewVerificationDoc(id: string): Promise<VerificationDoc> {
        const include: Includeable[] = [
            {
                model: User,
                attributes: ['id', 'name', 'email'],
            },
        ];

        const doc: VerificationDoc | null = await VerificationDoc.findByPk(id, { include });

        if (!doc) {
            throw new NotFoundError('Verification document not found');
        }

        return doc;
    }

    static async viewVerificationDocs(queryData?: IViewVerificationDocsQuery): Promise<{ docs: VerificationDoc[], count?: number, totalPages?: number }> {
        let conditions: Record<string, unknown> = {};
        let paginate = false;
        const { page, size, userId, type, status } = queryData as IViewVerificationDocsQuery;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        const where: WhereOptions = {};

        if (userId) {
            where.userId = userId;
        }

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        const { rows: docs, count }: { rows: VerificationDoc[], count: number } = await VerificationDoc.findAndCountAll({
            ...conditions,
            where,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (paginate && docs.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { docs, count, ...totalPages };
        } else return { docs };
    }

    static async validateVerificationDocData(data: Partial<IVerificationDoc>): Promise<Partial<IVerificationDoc>> {
        const { userId, type, status, url } = data;

        const missingFields = [];

        if (!userId) missingFields.push('userId');
        if (!type) missingFields.push('type');
        if (!status) missingFields.push('status');
        if (!url) missingFields.push('url');

        if (missingFields.length > 0) {
            throw new BadRequestError(`Missing or invalid fields: ${missingFields.join(', ')}`);
        }

        if (!Object.values(DocType).includes(type as DocType)) {
            throw new BadRequestError('Invalid document type');
        }

        if (!Object.values(VerificationStatus).includes(status as VerificationStatus)) {
            throw new BadRequestError('Invalid verification status');
        }

        return data;
    }


    
    static async addWithdrawalRequest(requestData: IWithdrawalRequest, transaction?: Transaction): Promise<WithdrawalRequest> {
        const newRequest = await WithdrawalRequest.create({ ...requestData }, { transaction });
        return newRequest;
    }

    static async updateWithdrawalRequest(request: WithdrawalRequest, dataToUpdate: Partial<IWithdrawalRequest>): Promise<WithdrawalRequest> {
        await request.update(dataToUpdate);
        const updatedRequest = await this.viewWithdrawalRequest(request.id);
        return updatedRequest;
    }

    static async deleteWithdrawalRequest(request: WithdrawalRequest, transaction?: Transaction): Promise<void> {
        transaction ? await request.destroy({ transaction }) : await request.destroy();
    }

    static async viewWithdrawalRequest(id: string): Promise<WithdrawalRequest> {
        const include: Includeable[] = [
            {
                model: User,
                attributes: ['id', 'name', 'email'],
            },
        ];

        const request: WithdrawalRequest | null = await WithdrawalRequest.findByPk(id, { include });

        if (!request) {
            throw new NotFoundError('Withdrawal request not found');
        }

        return request;
    }

    static async viewWithdrawalRequests(queryData?: IViewWithdrawalRequestsQuery): Promise<{ requests: WithdrawalRequest[], count?: number, totalPages?: number }> {
        let conditions: Record<string, unknown> = {};
        let paginate = false;
        const { page, size, userId, status, minAmount, maxAmount } = queryData as IViewWithdrawalRequestsQuery;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        const where: WhereOptions = {};

        if (userId) {
            where.userId = userId;
        }

        if (status) {
            where.status = status;
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            where.amount = {};
            if (minAmount !== undefined) where.amount[Op.gte] = minAmount;
            if (maxAmount !== undefined) where.amount[Op.lte] = maxAmount;
        }

        const { rows: requests, count }: { rows: WithdrawalRequest[], count: number } = await WithdrawalRequest.findAndCountAll({
            ...conditions,
            where,
            order: [['requestDate', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (paginate && requests.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { requests, count, ...totalPages };
        } else return { requests };
    }

    static async validateWithdrawalRequestData(data: Partial<IWithdrawalRequest>): Promise<Partial<IWithdrawalRequest>> {
        const { userId, amount, requestDate, description, status } = data;

        const missingFields = [];

        if (!userId) missingFields.push('userId');
        if (!amount) missingFields.push('amount');
        if (!requestDate) missingFields.push('requestDate');
        if (!description) missingFields.push('description');
        if (!status) missingFields.push('status');

        if (missingFields.length > 0) {
            throw new BadRequestError(`Missing or invalid fields: ${missingFields.join(', ')}`);
        }

        if (!Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)) {
            throw new BadRequestError('Invalid withdrawal status');
        }

        if (amount === undefined || amount <= 0) {
            throw new BadRequestError('Amount must be greater than 0');
        }

        return data;
    }


    static async createReferral(referralData: IReferral, transaction?: Transaction): Promise<Referral> {
        const newReferral = await Referral.create({ ...referralData }, { transaction });
        return newReferral;
    }

    static async updateReferral(referral: Referral, dataToUpdate: Partial<IReferral>): Promise<Referral> {
        await referral.update(dataToUpdate);
        const updatedReferral = await this.viewReferral(referral.id);
        return updatedReferral;
    }

    static async deleteReferral(referral: Referral, transaction?: Transaction): Promise<void> {
        transaction ? await referral.destroy({ transaction }) : await referral.destroy();
    }

    static async viewReferral(id: string): Promise<Referral> {
        const include: Includeable[] = [
            {
                model: User,
                as: 'referee',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: User,
                as: 'referred',
                attributes: ['id', 'name', 'email'],
            },
        ];

        const referral: Referral | null = await Referral.findByPk(id, { include });

        if (!referral) {
            throw new NotFoundError('Referral not found');
        }

        return referral;
    }

    static async viewReferrals(queryData?: IViewReferralsQuery): Promise<{ referrals: Referral[], count?: number, totalPages?: number }> {
        let conditions: Record<string, unknown> = {};
        let paginate = false;
        const { page, size, refereeId, referredId, status } = queryData as IViewReferralsQuery;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        const where: WhereOptions = {};

        if (refereeId) {
            where.refereeId = refereeId;
        }

        if (referredId) {
            where.referredId = referredId;
        }

        if (status) {
            where.status = status;
        }

        const { rows: referrals, count }: { rows: Referral[], count: number } = await Referral.findAndCountAll({
            ...conditions,
            where,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'referee',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: User,
                    as: 'referred',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (paginate && referrals.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { referrals, count, ...totalPages };
        } else return { referrals };
    }

    static async validateReferralData(data: Partial<IReferral>): Promise<Partial<IReferral>> {
        const { refereeId, referredId, status } = data;

        const missingFields = [];

        if (!refereeId) missingFields.push('refereeId');
        if (!referredId) missingFields.push('referredId');

        if (missingFields.length > 0) {
            throw new BadRequestError(`Missing or invalid fields: ${missingFields.join(', ')}`);
        }

        if (refereeId === referredId) {
            throw new BadRequestError('A user cannot refer themselves');
        }

        if (status && !Object.values(ReferralStatus).includes(status)) {
            throw new BadRequestError('Invalid referral status');
        }

        return data;
    }

    static async getUserReferrals(userId: string, role: 'referee' | 'referred'): Promise<Referral[]> {
        const where: WhereOptions = {};
        where[`${role}Id`] = userId;

        const referrals = await Referral.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'referee',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: User,
                    as: 'referred',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        return referrals;
    }
}