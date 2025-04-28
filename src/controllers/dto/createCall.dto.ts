/* eslint-disable indent */
import "reflect-metadata";
import {
    IsString,
    IsOptional,
    IsIn,
    IsBoolean,
    IsNumber,
    IsArray,
    IsISO8601,
} from "class-validator";

export class CreateCallDto {
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsIn(["audio", "video"])
    type!: "audio" | "video";

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tokenGatingAddresses?: string[];

    @IsOptional()
    @IsString()
    tokenGatingType?: string;

    @IsOptional()
    @IsNumber()
    durationRequirement?: number;

    @IsOptional()
    @IsBoolean()
    isScheduled?: boolean;

    @IsOptional()
    @IsISO8601()
    scheduledTime?: string;
}
