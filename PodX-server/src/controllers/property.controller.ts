import { Request, Response } from 'express';
import PropertyService, { IViewPropertiesQuery } from '../services/property.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { BadRequestError } from '../utils/customErrors';
import { IProperty } from '../models/property.model';

export default class PropertyController {
    static async getAllProperties(req: Request, res: Response) {
        const { page, size, q, category, minPrice, maxPrice, ownerId } = req.query;

        const queryParams: IViewPropertiesQuery = {
            ...(page && size ? { page: Number(page), size: Number(size) } : {}),
            ...(q && { q: q as string }),
            ...(category && { category: category as string }),
            ...(minPrice && { minPrice: Number(minPrice) }),
            ...(maxPrice && { maxPrice: Number(maxPrice) }),
            ...(ownerId && { ownerId: ownerId as string }),
        };

        const properties = await PropertyService.viewProperties(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Properties retrieved successfully',
            data: { ...properties },
        });
    }

    static async getPropertyById(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Property ID is required');
        }

        const isUserRequest = !!(req as AuthenticatedRequest).user; 

        const property = await PropertyService.viewProperty(id, isUserRequest);
        res.status(200).json({
            status: 'success',
            message: 'Property retrieved successfully',
            data: property,
        });
    }

    static async addProperty(req: AuthenticatedRequest, res: Response) {
        const validatedData = await PropertyService.validatePropertyData(req.body);

        const newProperty = await PropertyService.addProperty(validatedData as IProperty);
        res.status(201).json({
            status: 'success',
            message: 'Property added successfully',
            data: newProperty,
        });
    }

    static async updateProperty(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Property ID is required');
        }

        const property = await PropertyService.viewProperty(id);
        const validatedData = await PropertyService.validatePropertyData(req.body);

        const updatedProperty = await PropertyService.updateProperty(property, validatedData);
        res.status(200).json({
            status: 'success',
            message: 'Property updated successfully',
            data: updatedProperty,
        });
    }

    static async deleteProperty(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Property ID is required');
        }

        const property = await PropertyService.viewProperty(id);
        await PropertyService.deleteProperty(property);
        res.status(200).json({
            status: 'success',
            message: 'Property deleted successfully',
            data: null,
        });
    }
}