import { Op } from 'sequelize';
import Admin, { IAdmin } from '../../models/Postgres/admin.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import { ADMIN_EMAIL } from '../../utils/constants';
import moment from 'moment';
import UserSettings, { IBlockMeta } from '../../models/Postgres/userSettings.model';

export default class AdminService {

    static async createAdmin(adminData: IAdmin): Promise<Admin> {
        const existingAdmin = await Admin.findOne({ where: { email: adminData.email } });
        if (existingAdmin) {
            throw new BadRequestError('Admin with this email already exists');
        }

        const newAdmin = await Admin.create(adminData);
        return newAdmin;
    }

    static async getAllAdmins(): Promise<Admin[]> {
        // exclude the ADMIN_EMAIL from the list of admins
        return Admin.findAll({
            where: {
                email: {
                    [Op.ne]: ADMIN_EMAIL,
                },
            },
        });
    }

    static async getAdminByEmail(email: string): Promise<Admin> {

        const admin: Admin | null = await Admin.findOne({ where: { email } });

        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        return admin;
    }

    static async deleteAdmin(adminId: string): Promise<void> {
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        if (admin.email === ADMIN_EMAIL) {
            throw new BadRequestError('Cannot delete the super admin');
        }

        await admin.destroy();
    }

    static async blockUser(id: string, status: boolean, reason: string): Promise<UserSettings> {
        const userSettings = await UserSettings.findOne({ where: { userId: id } });

        if (!userSettings) {
            throw new NotFoundError('User settings not found');
        }

        const currentDate = moment().format('YYYY-MM-DD');
        const updatedMeta: IBlockMeta = userSettings.meta || { blockHistory: [], unblockHistory: [] };

        if (status) {
            // Blocking the user
            if (userSettings.isBlocked) {
                throw new BadRequestError('User is already blocked');
            }
            updatedMeta.blockHistory.push({ [currentDate]: reason });
        } else {
            // Unblocking the user
            if (!userSettings.isBlocked) {
                throw new BadRequestError('User is not blocked');
            }
            updatedMeta.unblockHistory.push({ [currentDate]: reason });
        }

        await userSettings.update({
            isBlocked: status,
            meta: updatedMeta,
        });

        return userSettings;
    }
}