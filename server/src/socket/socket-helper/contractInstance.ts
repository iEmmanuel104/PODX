import { ethers } from 'ethers';
import PodXABI from '../../../web3/abi.json';
import { PodXContract } from './interface';
import { CONTRACT_ADDRESS } from '../../utils/constants';

const ETHEREUM_RPC_URL = 'https://sepolia.base.org';

const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
const podXContract = new ethers.Contract(CONTRACT_ADDRESS, PodXABI, provider) as unknown as PodXContract;

export function getPodXContractInstance(signerOrProvider?: ethers.Signer | ethers.Provider): PodXContract {
    if (signerOrProvider) {
        return podXContract.connect(signerOrProvider) as PodXContract;
    }
    return podXContract;
}

export async function getSignerForAddress(address: string) {
    return provider.getSigner(address);
}

export { provider };