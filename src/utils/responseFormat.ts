/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ICall } from "../models/Mongodb/call.model";

export function formatCallResponse(
    call: ICall,
    hostData: {
        walletAddress: string;
        username: string;
    } | null,
    participants: Array<any>,
): object {
    return {
        status: "success",
        message: "Call details retrieved successfully",
        data: {
            roomId: call.roomId,
            title: call.title,
            description: call.description,
            type: call.type,
            host: hostData
                ? {
                    walletAddress: hostData.walletAddress || "",
                    username: hostData.username || "",
                }
                : null,
            status: call.status,
            isActive: call.isActive !== false,
            isPrivate: call.isPrivate !== false,
            tokenGating: {
                enabled: call.tokenGating?.enabled || false,
                type: call.tokenGating?.type || "",
                allowedWallets: call.tokenGating?.addresses || [],
            },
            participants: participants,
            resources: {
                ipfs: call.ipfsUrl || "",
            },
            isScheduled: call.isScheduled,
            scheduledTime: call.isScheduled
                ? call.scheduledTime?.toISOString()
                : undefined,
            timestamps: {
                createdAt: call.createdAt,
            },
        },
    };
}
