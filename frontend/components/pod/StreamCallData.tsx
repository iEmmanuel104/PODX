'use client';
import { CallResponse, UserResponse } from "@stream-io/video-react-sdk";


export interface StreamCallData extends CallResponse {
    custom: {
        title: string;
        type: string;
        sessionId: string;
    };
    created_by: UserResponse & {
        custom?: {
            username?: string;
        };
    };
    starts_at: string;
}
