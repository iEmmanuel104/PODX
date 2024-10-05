// investmentController.ts
import { Request, Response } from 'express';
import InvestmentService, { IViewInvestmentsQuery } from '../services/investment.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { BadRequestError } from '../utils/customErrors';
import { IInvestment, InvestmentStatus } from '../models/investment.model';

export default class InvestmentController {
    static async getAllInvestments(req: Request, res: Response) {
        const { page, size, status, propertyId, investorId, minAmount, maxAmount } = req.query;

        const queryParams: IViewInvestmentsQuery = {
            ...(page && size ? { page: Number(page), size: Number(size) } : {}),
            ...(status && { status: status as InvestmentStatus }),
            ...(propertyId && { propertyId: propertyId as string }),
            ...(investorId && { investorId: investorId as string }),
            ...(minAmount && { minAmount: Number(minAmount) }),
            ...(maxAmount && { maxAmount: Number(maxAmount) }),
        };

        const investments = await InvestmentService.viewInvestments(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Investments retrieved successfully',
            data: { ...investments },
        });
    }

    static async getInvestmentById(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Investment ID is required');
        }

        const investment = await InvestmentService.viewInvestment(id);
        res.status(200).json({
            status: 'success',
            message: 'Investment retrieved successfully',
            data: investment,
        });
    }

    static async addInvestment(req: AuthenticatedRequest, res: Response) {
        const validatedData = await InvestmentService.validateInvestmentData(req.body);

        const newInvestment = await InvestmentService.addInvestment(validatedData as IInvestment);
        res.status(201).json({
            status: 'success',
            message: 'Investment added successfully',
            data: newInvestment,
        });
    }

    static async updateInvestment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Investment ID is required');
        }

        const investment = await InvestmentService.viewInvestment(id);
        const validatedData = await InvestmentService.validateInvestmentData(req.body);

        const updatedInvestment = await InvestmentService.updateInvestment(investment, validatedData);
        res.status(200).json({
            status: 'success',
            message: 'Investment updated successfully',
            data: updatedInvestment,
        });
    }

    static async deleteInvestment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Investment ID is required');
        }

        const investment = await InvestmentService.viewInvestment(id);
        await InvestmentService.deleteInvestment(investment);
        res.status(200).json({
            status: 'success',
            message: 'Investment deleted successfully',
            data: null,
        });
    }

    static async getInvestmentsByProperty(req: Request, res: Response) {
        const { propertyId } = req.params;
        const { page, size } = req.query;

        if (!propertyId) {
            throw new BadRequestError('Property ID is required');
        }

        const queryParams: IViewInvestmentsQuery = {
            ...(page && size ? { page: Number(page), size: Number(size) } : {}),
            propertyId,
        };

        const investments = await InvestmentService.viewInvestments(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Investments for property retrieved successfully',
            data: { ...investments },
        });
    }

    static async getInvestmentsByInvestor(req: Request, res: Response) {
        const { investorId } = req.params;
        const { page, size } = req.query;

        if (!investorId) {
            throw new BadRequestError('Investor ID is required');
        }

        const queryParams: IViewInvestmentsQuery = {
            ...(page && size ? { page: Number(page), size: Number(size) } : {}),
            investorId,
        };

        const investments = await InvestmentService.viewInvestments(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Investments for investor retrieved successfully',
            data: { ...investments },
        });
    }
}