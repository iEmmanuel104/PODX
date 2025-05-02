/* eslint-disable indent */
import "reflect-metadata";
import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    IsOptional,
    IsIn,
    IsBoolean,
    IsNumber,
    IsArray,
    IsISO8601,
    IsNotEmpty,
    IsPositive,
    ValidateIf,
} from "class-validator";
import { Hex } from "../../utils/types";

export enum CallType {
    AUDIO = "audio",
    VIDEO = "video",
}

export enum TokenGatingType {
    EXTERNAL = "external",
    NONE = "",
}

export class CreateCallDto {
    @ApiProperty({
        description: "Title of the call",
        example: "Team Meeting",
    })
    @IsString()
    @IsNotEmpty({ message: "Title is required" })
    title!: string;

    @ApiProperty({
        description: "Description of the call",
        example: "Weekly team sync-up",
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: "Type of the call",
        example: CallType.VIDEO,
        enum: CallType,
    })
    @IsString()
    @IsIn(Object.values(CallType))
    @IsNotEmpty({ message: "Type is required" })
    type!: CallType;

    @ApiProperty({
        description: "List of token gating addresses",
        example: ["0x123...", "0x456..."],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tokenGatingAddresses?: Hex[];

    @ApiProperty({
        description: "Type of token gating (e.g., ERC20, ERC721)",
        // example: TokenGatingType.ERC20,
        enum: TokenGatingType,
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsIn(Object.values(TokenGatingType), {
        message: "Invalid token gating type",
    })
    tokenGatingType?: TokenGatingType;

    @ApiProperty({
        description: "Duration requirement for the call in minutes",
        example: 30,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive({ message: "Duration must be a positive number" })
    durationRequirement?: number | `${number}`;

    @ApiProperty({
        description: "Indicates if the call is scheduled",
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isScheduled: boolean = false;

    @ApiProperty({
        description: "Scheduled time for the call (ISO 8601 format)",
        example: "2025-05-02T12:00:00Z",
        required: false,
    })
    @IsOptional()
    @ValidateIf((o) => o.isScheduled === true)
    @IsISO8601(
        { strict: true },
        { message: "Scheduled time must be in ISO 8601 format" },
    )
    scheduledTime?: string;
}
