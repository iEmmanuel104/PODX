import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_SECRET, JWT_ADMIN_ACCESS_SECRET, JWT_REFRESH_SECRET } from './constants';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from './redis';
import { UnauthorizedError, TokenExpiredError, JsonWebTokenError } from './customErrors';
import { CompareTokenData, DecodedTokenData, ENCRYPTEDTOKEN, GenerateCodeData, GenerateTokenData, SaveTokenToCache, GenerateAdminTokenData } from './interface';
import { ethers } from 'ethers';

class TokenCacheUtil {
    static saveTokenToCache({ key, token, expiry }: SaveTokenToCache) {
        const response = expiry ? redisClient.setex(key, expiry, token) : redisClient.set(key, token);
        return response;
    }

    static async saveTokenToCacheList({ key, token, expiry }: SaveTokenToCache) {
        const response = await redisClient.lpush(key, token);

        if (expiry) {
            await redisClient.expire(key, expiry);
        }

        return response;
    }


    static async saveAuthTokenToCache({ key, token, expiry }: SaveTokenToCache) {
        // Save token and state as an array [token, state] in Redis
        const state = 'active'; // You can set the initial state as needed
        const dataToSave = { token, state };

        const response = expiry
            ? redisClient.setex(key, expiry, JSON.stringify(dataToSave))
            : redisClient.set(key, token);

        return response;
    }

    static async updateTokenState(key: string, newState: string) {
        // Fetch existing token and state from Redis
        const dataString = await redisClient.get(key);
        if (!dataString) {
            throw new Error('Token not found in Redis');
        }

        const { token, state } = JSON.parse(dataString);

        if (state !== 'active') {
            throw new UnauthorizedError('Unauthorized token');  
        }

        // Save updated state along with the existing token and remaining TTL
        const existingTTL = await redisClient.ttl(key);
        const updatedData = { token, state: newState };

        await redisClient.setex(key, existingTTL, JSON.stringify(updatedData));
    }

    static async getTokenFromCache(key: string): Promise<string | null> {
        const tokenString = await redisClient.get(key);
        if (!tokenString) {
            return null;
        }            
        return tokenString;
    }

    static async compareToken(key: string, token: string) {
        const _token = await TokenCacheUtil.getTokenFromCache(key);
        return _token === token;
    }
    static async deleteTokenFromCache(key: string) {
        await redisClient.del(key);
    }
}

class AuthUtil {

    static getSecretKeyForTokenType(type: ENCRYPTEDTOKEN): { secretKey: string, expiry: number } {
        switch (type) {
        case 'access':
            // 1day
            return { secretKey: JWT_ACCESS_SECRET, expiry: 60 * 60 * 24 }; 
        case 'refresh':
            // 7days
            return { secretKey: JWT_REFRESH_SECRET, expiry: 60 * 60 * 24 * 7 };
        case 'admin':
            // 7days
            return { secretKey: JWT_ADMIN_ACCESS_SECRET, expiry: 60 * 60 * 24 * 7 };
        default:
            // 20min
            return { secretKey: JWT_SECRET, expiry: 60 * 20 };
        }
    }

    static async generateToken(info: GenerateTokenData) {
        const { type, user } = info;

        const { expiry } = this.getSecretKeyForTokenType(type);

        const tokenData: Omit<DecodedTokenData, 'token'> = {
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
            },
            tokenType: type,
        };
        // const tokenKey = `${type}_token:${user.id}`;
        const token = jwt.sign(tokenData, user.walletAddress, { expiresIn: expiry });
        // await TokenCacheUtil.saveTokenToCache({ key: tokenKey, token, expiry });

        return token;
    }

    static async decodeToken(token: string) {
        return jwt.decode(token) as DecodedTokenData;
    }

    static async generateAdminToken(info: GenerateAdminTokenData) {
        const { type, identifier } = info;
        const { secretKey, expiry } = this.getSecretKeyForTokenType(type);

        //omit token and user
        const tokenData: Omit<DecodedTokenData, 'token' | 'user'> = {
            authKey: identifier,
            tokenType: type,
        };
        // const tokenKey = `${type}_token:${identifier}`;
        const token = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
        // await TokenCacheUtil.saveTokenToCache({ key: tokenKey, token, expiry });

        return token;
    }

    static async generateCode({ type, identifier, expiry }: GenerateCodeData) {
        // const tokenKey = `${type}_code:${identifier}`;
        let token:number | string;
        if (type === 'passwordreset') {
            token = uuidv4();
        } else {
            token = Math.floor(100000 + Math.random() * 900000).toString();
        }

        console.log({ expiry, identifier });

        // await TokenCacheUtil.saveTokenToCache({ key: tokenKey, token, expiry });

        return token;
    }

    static compareToken({ user, tokenType, token }: CompareTokenData) {
        const tokenKey = `${tokenType}_token:${user.id}`;
        return TokenCacheUtil.compareToken(tokenKey, token);
    }

    // static compareCode({ user, tokenType, token }: CompareTokenData) {
    //     const tokenKey = `${tokenType}_code:${user.id}`;
    //     return TokenCacheUtil.compareToken(tokenKey, token);
    // }

    // static compareAdminCode({ identifier, tokenType, token }: CompareAdminTokenData) {
    //     const tokenKey = `${tokenType}_code:${identifier}`;
    //     return TokenCacheUtil.compareToken(tokenKey, token);
    // }

    static verifyToken(token: string, walletAddress: string) {
        try {
            return jwt.verify(token, walletAddress);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError('Token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new JsonWebTokenError('Invalid token');
            } else if (error instanceof jwt.NotBeforeError) {
                throw new UnauthorizedError('Token not yet active');
            } else {
                throw error;
            }
        }
    }

    static verifyWalletSignature(walletAddress: string, signature: string): boolean {
        try {
            const message = `Sign this message to verify your wallet: ${walletAddress}`;
            const signerAddress = ethers.verifyMessage(message, signature);
            return signerAddress.toLowerCase() === walletAddress.toLowerCase();
        } catch (error) {
            console.error('Error verifying wallet signature:', error);
            return false;
        }
    }

    static verifyAdminToken(token: string, type: ENCRYPTEDTOKEN) {
        try {
            const { secretKey } = this.getSecretKeyForTokenType(type);
            return jwt.verify(token, secretKey);

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError('Token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new JsonWebTokenError('Invalid token');
            } else if (error instanceof jwt.NotBeforeError) {
                throw new UnauthorizedError('Token not yet active');
            } else {
                throw error;
            }
        }
    }

    // static async deleteToken({ user, tokenType, tokenClass }: DeleteToken) {
    //     const tokenKey = `${tokenType}_${tokenClass}:${user.id}`;
    //     await TokenCacheUtil.deleteTokenFromCache(tokenKey);
    // }

}

export { AuthUtil, TokenCacheUtil };