import { Transaction, Op, Includeable, WhereOptions } from 'sequelize';
import Investment, { IInvestment, InvestmentStatus } from '../models/investment.model';
import Property from '../models/property.model';
import User from '../models/Postgres/user.model';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewInvestmentsQuery {
    page?: number;
    size?: number;
    status?: InvestmentStatus;
    propertyId?: string;
    investorId?: string;
    minAmount?: number;
    maxAmount?: number;
}

export default class InvestmentService {
    static async addInvestment(investmentData: IInvestment, transaction?: Transaction): Promise<Investment> {
        const newInvestment = await Investment.create({ ...investmentData }, { transaction });
        return newInvestment;
    }

    static async updateInvestment(investment: Investment, dataToUpdate: Partial<IInvestment>): Promise<Investment> {
        await investment.update(dataToUpdate);
        const updatedInvestment = await this.viewInvestment(investment.id);
        return updatedInvestment;
    }

    static async deleteInvestment(investment: Investment, transaction?: Transaction): Promise<void> {
        transaction ? await investment.destroy({ transaction }) : await investment.destroy();
    }

    static async viewInvestment(id: string): Promise<Investment> {
        const include: Includeable[] = [
            {
                model: Property,
                attributes: ['id', 'name', 'category', 'price'],
            },
            {
                model: User,
                as: 'investor',
                attributes: ['id', 'name', 'email'],
            },
        ];

        const investment: Investment | null = await Investment.findByPk(id, { include });

        if (!investment) {
            throw new NotFoundError('Investment not found');
        }

        return investment;
    }

    static async viewInvestments(queryData?: IViewInvestmentsQuery): Promise<{ investments: Investment[], count?: number, totalPages?: number }> {
        let conditions: Record<string, unknown> = {};
        let paginate = false;
        const { page, size, status, propertyId, investorId, minAmount, maxAmount } = queryData as IViewInvestmentsQuery;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        const where: WhereOptions = {};

        if (status) {
            where.status = status;
        }

        if (propertyId) {
            where.propertyId = propertyId;
        }

        if (investorId) {
            where.investorId = investorId;
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            where.amount = {};
            if (minAmount !== undefined) where.amount[Op.gte] = minAmount;
            if (maxAmount !== undefined) where.amount[Op.lte] = maxAmount;
        }

        const { rows: investments, count }: { rows: Investment[], count: number } = await Investment.findAndCountAll({
            ...conditions,
            where,
            order: [['date', 'DESC']],
            include: [
                {
                    model: Property,
                    attributes: ['id', 'name', 'category', 'price'],
                },
                {
                    model: User,
                    as: 'investor',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (paginate && investments.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { investments, count, ...totalPages };
        } else return { investments };
    }

    static async validateInvestmentData(data: Partial<IInvestment>): Promise<Partial<IInvestment>> {
        const { propertyId, amount, sharesAssigned, estimatedReturns, status, propertyOwner, investorId } = data;

        const missingFields = [];

        if (!propertyId) missingFields.push('propertyId');
        if (!amount) missingFields.push('amount');
        if (!sharesAssigned) missingFields.push('sharesAssigned');
        if (!estimatedReturns) missingFields.push('estimatedReturns');
        if (!status) missingFields.push('status');
        if (!propertyOwner) missingFields.push('propertyOwner');
        if (!investorId) missingFields.push('investorId');

        if (missingFields.length > 0) {
            throw new BadRequestError(`Missing or invalid fields: ${missingFields.join(', ')}`);
        }

        // Additional validations can be added here

        return data;
    }
}