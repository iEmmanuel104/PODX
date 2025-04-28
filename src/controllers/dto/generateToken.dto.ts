/* eslint-disable indent */
import {
    IsString,
    IsOptional,
    IsIn,
    IsObject,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class TokenPermissionsDto {
    @IsOptional()
    admin?: boolean;

    @IsOptional()
    canConsume?: boolean;

    @IsOptional()
    canProduce?: boolean;

    @IsOptional()
    @IsObject()
    canProduceSources?: {
        cam?: boolean;
        mic?: boolean;
        screen?: boolean;
    };

    @IsOptional()
    canRecvData?: boolean;

    @IsOptional()
    canSendData?: boolean;

    @IsOptional()
    canUpdateMetadata?: boolean;
}

export class GenerateTokenDto {
    @IsString()
    roomId!: string;

    @IsOptional()
    @IsIn(["host", "coHost", "speaker", "listener", "guest", "bot"])
    role?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => TokenPermissionsDto)
    permissions?: TokenPermissionsDto;
}
