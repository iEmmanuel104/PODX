import pinataSDK from '@pinata/sdk';
import dotenv from 'dotenv';

dotenv.config();

const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
    pinataJWTKey: process.env.PINATA_JWT
});

export async function pinFileWithPinata(file) {
    try {
        const result = await pinata.pinFileToIPFS(file);
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        console.error('Error pinning file to IPFS:', error);
        throw error;
    }
}

export async function pinJsonWithPinata(json) {
    try {
        const result = await pinata.pinJSONToIPFS(json);
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        console.error('Error pinning JSON to IPFS:', error);
        throw error;
    }
}
