// interface.ts
import { BaseContract, ContractTransactionResponse } from "ethers";

export interface ICreateSessionParams {
    sessionName: string;
    tokenURI: string;
    sessionId: number;
}

export interface IBatchMintParams {
    recipients: string[];
    sessionId: number;
}

export interface SessionDetails {
    name: string;
    tokenURI: string;
    exists: boolean;
}

export interface POAPContract extends BaseContract {
    // Session Management
    createSession: {
        (
            sessionName: string,
            tokenURI: string,
            sessionId: number,
        ): Promise<ContractTransactionResponse>;
    };

    // Batch Minting
    batchMintTokens: {
        (
            recipients: string[],
            sessionId: number,
        ): Promise<ContractTransactionResponse>;
    };

    // Helper Methods
    hasReceivedTokenForSession: {
        (sessionId: number, recipient: string): Promise<boolean>;
    };

    getSessionDetails: {
        (sessionId: number): Promise<[string, string, boolean]>;
    };

    // Token Management
    safeMint: {
        (to: string, uri: string): Promise<ContractTransactionResponse>;
    };

    burn: {
        (tokenId: number): Promise<ContractTransactionResponse>;
    };

    revoke: {
        (tokenId: number): Promise<ContractTransactionResponse>;
    };

    tokenURI: {
        (tokenId: number): Promise<string>;
    };
}
