/* eslint-disable indent */
import jwt from "jsonwebtoken";
import {
    JWT_SECRET,
    JWT_ACCESS_SECRET,
    JWT_ADMIN_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
} from "./constants";
import { v4 as uuidv4 } from "uuid";
import { redisClient } from "./redis";
import {
    UnauthorizedError,
    TokenExpiredError,
    JsonWebTokenError,
} from "./customErrors";
import {
    CompareTokenData,
    DecodedTokenData,
    ENCRYPTEDTOKEN,
    GenerateTokenData,
} from "./interface";
import { ethers } from "ethers";

async function getTokenFromCache(key: string): Promise<string | null> {
    const tokenString = await redisClient.get(key);
    if (!tokenString) {
        return null;
    }
    return tokenString;
}

async function compareToken(key: string, token: string): Promise<boolean> {
    const _token = await getTokenFromCache(key);
    return _token === token;
}

function verifyWalletHash(
    walletAddress: string,
    hash: string,
    timestamp: number,
    nonce: string,
): boolean {
    const message = `Create hash for wallet: ${walletAddress} at ${timestamp} with nonce ${nonce}`;
    const expectedHash = ethers.id(message);
    return expectedHash === hash;
}

function createWalletHash(walletAddress: string): {
    hash: string;
    timestamp: number;
    nonce: string;
} {
    const timestamp = Date.now();
    const nonce = uuidv4();
    const message = `Create hash for wallet: ${walletAddress} at ${timestamp} with nonce ${nonce}`;
    const hash = ethers.id(message);
    return { hash, timestamp, nonce };
}

function getSecretKeyForTokenType(type: ENCRYPTEDTOKEN): {
    secretKey: string;
    expiry: number;
} {
    switch (type) {
        case "access":
            // 1day
            return { secretKey: JWT_ACCESS_SECRET, expiry: 60 * 60 * 24 };
        case "refresh":
            // 7days
            return {
                secretKey: JWT_REFRESH_SECRET,
                expiry: 60 * 60 * 24 * 7,
            };
        case "admin":
            // 7days
            return {
                secretKey: JWT_ADMIN_ACCESS_SECRET,
                expiry: 60 * 60 * 24 * 7,
            };
        default:
            // 20min
            return { secretKey: JWT_SECRET, expiry: 60 * 20 };
    }
}

class AuthUtil {
    static compareToken({
        user,
        tokenType,
        token,
    }: CompareTokenData): Promise<boolean> {
        const tokenKey = `${tokenType}_token:${user.id}`;
        return compareToken(tokenKey, token);
    }

    static generateTokenWithHash(info: GenerateTokenData): string {
        const { type, user } = info;
        const { expiry } = getSecretKeyForTokenType(type);

        const {
            hash: walletHash,
            timestamp,
            nonce,
        } = createWalletHash(user.walletAddress);

        const tokenData: Omit<DecodedTokenData, "token"> = {
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
            },
            tokenType: type,
            walletHash,
            timestamp,
            nonce,
        };

        const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: expiry });
        return token;
    }

    static verifyTokenWithHash(token: string): DecodedTokenData {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as DecodedTokenData;
            if (
                !verifyWalletHash(
                    decoded.user.walletAddress,
                    decoded.walletHash,
                    decoded.timestamp,
                    decoded.nonce,
                )
            ) {
                throw new UnauthorizedError("Invalid wallet hash");
            }

            // Optional: Check if the token is too old based on the timestamp
            const currentTime = Date.now();
            const tokenAge = currentTime - decoded.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (tokenAge > maxAge) {
                throw new TokenExpiredError(
                    "Token has exceeded the maximum age",
                );
            }

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError("Token expired");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new JsonWebTokenError("Invalid token");
            } else if (error instanceof jwt.NotBeforeError) {
                throw new UnauthorizedError("Token not yet active");
            } else {
                throw error;
            }
        }
    }
}

export { AuthUtil };
