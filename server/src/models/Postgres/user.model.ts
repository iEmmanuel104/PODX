/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, HasOne, Default, BeforeFind, Scopes,
    IsEmail, IsUUID, PrimaryKey, Index, BeforeCreate, BeforeUpdate,
    Unique,
} from 'sequelize-typescript';
import Password from './password.model';
import UserSettings from './userSettings.model';
import { FindOptions } from 'sequelize';

export enum UserType {
    INVESTOR = 'investor',
    PROJECT_OWNER = 'project_owner',
}

@Scopes(() => ({
    withSettings: {
        include: [
            {
                model: UserSettings,
                as: 'settings',
                attributes: ['joinDate', 'isBlocked', 'isDeactivated', 'lastLogin', 'meta'],
            },
        ],
    },
}))
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
    
    @IsEmail
    @Index
    @Column({
        type: DataType.STRING, allowNull: false,
        get() {
            return this.getDataValue('email').trim().toLowerCase();
        },
        set(value: string) {
            this.setDataValue('email', value.trim().toLowerCase());
        },
    })
        email: string;

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
        gender: string;

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
    
    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: { activated: false, emailVerified: false } })
        status: {
        activated: boolean;
        emailVerified: boolean;
        walletVerified: boolean;
    };

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

    @Column({ type: DataType.JSONB })
        phone: {
        countryCode: string;
        number: string;
    };

    @Column({
        type: DataType.DATEONLY,
        validate: {
            isDate: true,
            isValidDate(value: string | Date) {
                if (new Date(value) > new Date()) {
                    throw new Error('Date of birth cannot be in the future');
                }
            },
        },
    })
        dob: Date;
    
    @Column({ type: DataType.JSONB })
        address: {
        street: string;
        city: string;
        state: string;
        country: string;
    };

    @Column({
        type: DataType.ENUM,
        values: Object.values(UserType),
        allowNull: false,
        defaultValue: UserType.INVESTOR,
    })
        type: UserType;
    
    @Column({ type: DataType.STRING })
        referralBonus: string;

    // Associations
    @HasOne(() => Password)
        password: Password;

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
    status: {
        activated: boolean;
        emailVerified: boolean;
        walletVerified: boolean;
    };
    displayImage?: string;
    fullName?: string;
    phone?: {
        countryCode: string;
        number: string
    };
    dob?: Date;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
    };
    type: UserType;
    referralBonus?: string;
}