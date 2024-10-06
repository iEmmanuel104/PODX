/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, HasOne, Default, BeforeFind,
    IsUUID, PrimaryKey, Index, BeforeCreate, BeforeUpdate,
    Unique,
} from 'sequelize-typescript';
import UserSettings from './userSettings.model';
import { FindOptions } from 'sequelize';

@Table
export default class User extends Model<User | IUser> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    
    @Unique
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('walletAddress', value.toLowerCase());
        },
    })
        walletAddress: string;
    

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('firstName', User.capitalizeFirstLetter(value));
        },
    })
        firstName: string;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('lastName', User.capitalizeFirstLetter(value));
        },
    })
        lastName: string;

    @Column({
        type: DataType.STRING,
        set(value: string) {
            if (value) {
                this.setDataValue('otherName', User.capitalizeFirstLetter(value));
            }
        },
    })
        otherName: string;

    @Column({ type: DataType.STRING })
        displayImage: string;

    @Unique
    @Column({
        type: DataType.STRING, allowNull: false,
        get() {
            return this.getDataValue('username').trim().toLowerCase();
        }, set(value: string) {
            this.setDataValue('username', value.trim().toLowerCase());
        },
    })
        username: string;

    @Column({
        type: DataType.VIRTUAL,
        get() {
            if (this.getDataValue('otherName')) {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')} ${this.getDataValue('otherName')}`.trim();
            } else {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')}`.trim();
            }
        },
        set(value: string) {
            const names = value.split(' ');
            this.setDataValue('firstName', names[0]);
            this.setDataValue('lastName', names.slice(1).join(' '));
        },
    })
        fullName: string;

    // Associations
    @HasOne(() => UserSettings)
        settings: UserSettings;


    @BeforeFind
    static beforeFindHook(options: FindOptions) {
        if (options.where && 'email' in options.where && typeof options.where.email === 'string') {
            const whereOptions = options.where as { email?: string };
            if (whereOptions.email) {
                whereOptions.email = whereOptions.email.trim().toLowerCase();
            }
        }
    }

    @BeforeCreate
    @BeforeUpdate
    static beforeSaveHook(instance: User) {
        // Only capitalize if the field is changed (for updates) or new (for creates)
        if (instance.changed('firstName')) {
            instance.firstName = User.capitalizeFirstLetter(instance.firstName);
        }
        if (instance.changed('lastName')) {
            instance.lastName = User.capitalizeFirstLetter(instance.lastName);
        }
        if (instance.changed('otherName') && instance.otherName) {
            instance.otherName = User.capitalizeFirstLetter(instance.otherName);
        }
    }

    static capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export interface IUser {
    walletAddress: string;
    email: string;
    firstName: string;
    lastName: string;
    otherName?: string;
    username: string;
    displayImage?: string;
    fullName?: string;
}