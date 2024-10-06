// File: ethContractInstance.ts

import { ethers } from 'ethers';
import PodXABI from '../../../web3/abi.json';

// You'll need to set these up in your environment or configuration
const PODX_CONTRACT_ADDRESS = process.env.PODX_CONTRACT_ADDRESS || '';
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || '';

const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
const podXContract = new ethers.Contract(PODX_CONTRACT_ADDRESS, PodXABI, provider);

export function getPodXContractInstance(signerOrProvider?: ethers.Signer | ethers.Provider) {
    if (signerOrProvider) {
        return podXContract.connect(signerOrProvider);
    }
    return podXContract;
}

export async function getSignerForAddress(address: string) {
    return provider.getSigner(address);
}

export { provider };