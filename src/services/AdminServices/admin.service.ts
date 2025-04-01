import { Types } from 'mongoose';
import { Admin, IAdmin } from '../../models/Mongodb/admin.model';
import { UserSettings, IUserSettings, IBlockMeta } from '../../models/Mongodb/userSettings.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import { ADMIN_EMAIL } from '../../utils/constants';
import moment from 'moment';

export default class AdminService {

    static async createAdmin(adminData: IAdmin): Promise<IAdmin> {
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            throw new BadRequestError('Admin with this email already exists');
        }

        const newAdmin = await Admin.create(adminData);
        return newAdmin;
    }

    static async getAllAdmins(): Promise<IAdmin[]> {
        // exclude the ADMIN_EMAIL from the list of admins
        return Admin.find({ email: { $ne: ADMIN_EMAIL } });
    }

    static async getAdminByEmail(email: string): Promise<IAdmin> {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        return admin;
    }

    static async deleteAdmin(adminId: string): Promise<void> {
        const admin = await Admin.findById(adminId);
        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        if (admin.email === ADMIN_EMAIL) {
            throw new BadRequestError('Cannot delete the super admin');
        }

        await Admin.findByIdAndDelete(adminId);
    }

    static async blockUser(id: string, status: boolean, reason: string): Promise<IUserSettings> {
        const userSettings = await UserSettings.findOne({ userId: new Types.ObjectId(id) });

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

        const updatedUserSettings = await UserSettings.findOneAndUpdate(
            { userId: new Types.ObjectId(id) },
            {
                isBlocked: status,
                meta: updatedMeta,
            },
            { new: true }
        );

        if (!updatedUserSettings) {
            throw new NotFoundError('User settings not found');
        }

        return updatedUserSettings;
    }
}