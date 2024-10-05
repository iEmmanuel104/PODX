import { Transaction, Op, Includeable } from 'sequelize';
import Property, { IProperty } from '../models/property.model';
import User from '../models/Postgres/user.model';
import Investment from '../models/investment.model';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import PropertyStats, { updatePropertyVisitCount } from '../models/propertyStats.model';

export interface IViewPropertiesQuery {
    page?: number;
    size?: number;
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    ownerId?: string;
}

export default class PropertyService {
    static async addProperty(propertyData: IProperty, transaction?: Transaction): Promise<Property> {
        const newProperty = await Property.create({ ...propertyData }, { transaction });
        if (newProperty) await PropertyStats.create({ propertyId: newProperty.id }, { transaction });
        return newProperty;
    }

    static async updateProperty(property: Property, dataToUpdate: Partial<IProperty>): Promise<Property> {
        await property.update(dataToUpdate);
        const updatedProperty = await this.viewProperty(property.id);
        return updatedProperty;
    }

    static async deleteProperty(property: Property, transaction?: Transaction): Promise<void> {
        transaction ? await property.destroy({ transaction }) : await property.destroy();
    }

    static async viewProperty(id: string, isUserRequest: boolean = false): Promise<Property> {
        const include: Includeable[] = [
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: Investment,
                attributes: ['id', 'amount', 'date', 'sharesAssigned', 'estimatedReturns', 'status'],
            },
        ];

        const property: Property | null = await Property.findByPk(id, { include });

        if (!property) {
            throw new NotFoundError('Property not found');
        }

        if (isUserRequest) {
            await updatePropertyVisitCount(id);
            // Refresh the property to get the updated stats
            await property.reload();
        }

        return property;
    }

    static async viewProperties(queryData?: IViewPropertiesQuery): Promise<{ properties: Property[], count?: number, totalPages?: number }> {
        let conditions: Record<string, unknown> = {};
        let paginate = false;
        const { page, size, q: query, category, minPrice, maxPrice, ownerId } = queryData as IViewPropertiesQuery;

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            conditions = { limit, offset };
            paginate = true;
        }

        let where = {};

        if (query !== undefined && query !== '') {
            where = {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${query}%` } },
                    { description: { [Op.iLike]: `%${query}%` } },
                ],
            };
        }

        if (category) {
            where = { ...where, category };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where = { ...where, price: {} };
            if (minPrice !== undefined) where = { ...where, price: { [Op.gte]: minPrice } };
            if (maxPrice !== undefined) where = { ...where, price: { [Op.lte]: maxPrice } };
        }

        if (ownerId) {
            where = { ...where, ownerId };
        }

        const { rows: properties, count }: { rows: Property[], count: number } = await Property.findAndCountAll({
            ...conditions,
            where,
            order: [['updatedAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: PropertyStats,
                    as: 'stats',
                    attributes: ['overallRating', 'numberOfInvestors', 'ratingCount', 'visitCount'],
                },
            ],
        });

        if (paginate && properties.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { properties, count, ...totalPages };
        } else return { properties };
    }

    static async validatePropertyData(data: Partial<IProperty>): Promise<Partial<IProperty>> {
        const { category, name, description, location, price, gallery, shares, contractAddress, ownerId } = data;

        const missingFields = [];

        if (!category) missingFields.push('category');
        if (!name) missingFields.push('name');
        if (!description) missingFields.push('description');
        if (!location) missingFields.push('location');
        if (!price) missingFields.push('price');
        if (!gallery || gallery.length === 0) missingFields.push('gallery');
        if (!shares) missingFields.push('shares');
        if (!contractAddress) missingFields.push('contractAddress');
        if (!ownerId) missingFields.push('ownerId');

        if (missingFields.length > 0) {
            throw new BadRequestError(`Missing or invalid fields: ${missingFields.join(', ')}`);
        }

        // Additional validations can be added here

        return data;
    }
}