/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestError, UnprocessableEntityError, InternalServerError } from '../../utils/customErrors';
import { logger } from '../../utils/logger';

interface Web3ErrorDetail {
    code?: string;
    reason?: string;
    transaction?: string;
    message?: string;
}

export function handleWeb3Error(error: any): never {
    logger.error('Web3 Error Details:', error);

    const errorDetails: Web3ErrorDetail = {
        code: error.code,
        reason: error.reason,
        transaction: error.transaction,
        message: error.message,
    };

    // Handle insufficient funds
    if (
        errorDetails.code === 'INSUFFICIENT_FUNDS' ||
        (error as any)?.name === 'INSUFFICIENT_FUNDS' ||
        errorDetails.message?.toLowerCase().includes('insufficient funds')
    ) {
        throw new BadRequestError('Insufficient funds: Please ensure your wallet has enough BASE tokens to cover the transaction gas fees');
    }

    // Handle contract execution errors
    if (
        errorDetails.code === 'CALL_EXCEPTION' ||
        (error as any)?.name === 'UNPREDICTABLE_GAS_LIMIT' ||
        errorDetails.code === 'EXECUTION_REVERTED'
    ) {
        throw new UnprocessableEntityError(
            `Smart contract execution failed: ${errorDetails.reason || errorDetails.message || 'Unknown contract error'}`
        );
    }

    // Handle user rejected transactions
    if (errorDetails.code === 'ACTION_REJECTED' || errorDetails.message?.includes('user rejected')) {
        throw new BadRequestError('Transaction was rejected by the user');
    }

    // Handle network related errors
    if (errorDetails.code === 'NETWORK_ERROR' || errorDetails.message?.includes('network')) {
        throw new InternalServerError('Network error: Unable to connect to the blockchain');
    }

    // Handle timeout errors
    if (errorDetails.code === 'TIMEOUT' || errorDetails.message?.includes('timeout')) {
        throw new InternalServerError('Transaction timed out. Please try again');
    }

    // Default error handler
    throw new InternalServerError(
        errorDetails.message || 'An unexpected error occurred during the blockchain operation'
    );
}