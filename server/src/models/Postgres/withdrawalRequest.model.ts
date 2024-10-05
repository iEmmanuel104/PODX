/* eslint-disable no-unused-vars */
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, IsUUID, PrimaryKey, Default } from 'sequelize-typescript';
import User from './user.model';

export enum WithdrawalStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Completed = 'completed'
}
@Table
export default class WithdrawalRequest extends Model<WithdrawalRequest | IWithdrawalRequest> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @ForeignKey(() => User)
    @Column
        userId: string;

    @BelongsTo(() => User)
        user: User;

    @Column(DataType.DECIMAL(10, 2))
        amount: number;

    @Column(DataType.DATE)
        requestDate: Date;

    @Column(DataType.TEXT)
        description: string;

    @Column(DataType.ENUM(...Object.values(WithdrawalStatus)))
        status: WithdrawalStatus;
}

export interface IWithdrawalRequest {
    id?: string;
    userId: string;
    amount: number;
    requestDate: Date;
    description: string;
    status: WithdrawalStatus;
}