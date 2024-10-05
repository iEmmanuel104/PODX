
import { Table, Column, Model, DataType, IsUUID, PrimaryKey, Default, IsEmail, Unique } from 'sequelize-typescript';

@Table
export default class Admin extends Model<Admin | IAdmin> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @Column({ type: DataType.STRING, allowNull: false })
        name: string;

    @IsEmail
    @Unique
    @Column({ type: DataType.STRING, allowNull: false })
        email: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
        isSuperAdmin: boolean;
}

export interface IAdmin {
    name: string;
    email: string;
    isSuperAdmin?: boolean;
}