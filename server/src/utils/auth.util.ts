import { verifyMessage } from '@ethersproject/wallet';

class AuthUtil {
    // ... other methods

    static verifyWalletSignature(address: string, signature: string, message: string): boolean {
        try {
            const recoveredAddress = verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Error verifying wallet signature:', error);
            return false;
        }
    }

    // ... other methods
}

export default AuthUtil;
