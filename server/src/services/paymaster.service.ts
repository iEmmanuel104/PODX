import { http, Address, createPublicClient, createWalletClient, Hex, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const CHAIN_NAME = 'base';
const COINBASE_API_KEY = process.env.COINBASE_API_KEY || '';

// Format private key
const formatPrivateKey = (key: string | undefined): Hex => {
  if (!key) throw new Error('Private key is missing in environment variables');
  const formattedKey = key.startsWith('0x') ? key : `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(formattedKey)) {
    throw new Error('Invalid private key format');
  }
  return formattedKey as Hex;
};

const PRIVATE_KEY = formatPrivateKey(process.env.PAYMASTER_PRIVATE_KEY);
const RPC_URL = `https://api.developer.coinbase.com/rpc/v1/${CHAIN_NAME}/${COINBASE_API_KEY}`;

// Create clients
export const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  chain: base,
  transport: http(RPC_URL),
});

// Cache for smart account
let smartAccountCache: any = null;

// Create smart account from private key
export const createSmartAccount = async () => {
  if (smartAccountCache) return smartAccountCache;
  
  const owner = privateKeyToAccount(PRIVATE_KEY);
  const account = {
    address: owner.address,
    type: 'json-rpc' as const,
    source: 'viem-paymaster',
    signMessage: owner.signMessage,
    signTransaction: owner.signTransaction,
    signTypedData: owner.signTypedData
  };
  
  smartAccountCache = account;
  return account;
};

// Get smart account address
export const getSmartAccountAddress = async (): Promise<Address> => {
  const account = await createSmartAccount();
  return account.address;
};

// Initialize the client
export const initialize = async () => {
  await createSmartAccount();
  return true;
};

// Format and encode function data
export const encodeFunctionCall = (
  abi: any,
  functionName: string, 
  args: any[]
): Hex => {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
};

// Read contract data
export const readContract = async (
  contractAddress: Address,
  abi: any,
  functionName: string,
  args: any[] = []
): Promise<any> => {
  try {
    return await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName,
      args
    });
  } catch (error) {
    throw error;
  }
};

// Get client objects
export const getClients = async () => {
  const account = await createSmartAccount();
  
  return {
    accountClient: {
      sendUserOperation: async (params: any) => {
        try {
          if (account) {
            // In viem, sendTransaction is a wallet client method
            const hash = await walletClient.sendTransaction({
              account: account as any,
              ...params
            });
            return hash;
          } else {
            throw new Error('Account not initialized for transaction');
          }
        } catch (error) {
          console.error('Error sending transaction:', error);
          throw error;
        }
      },
      waitForUserOperationTransaction: async (hash: Hex) => {
        // Wait for transaction receipt
        return await publicClient.waitForTransactionReceipt({ hash });
      },
      getAddress: async () => account.address
    },
    publicClient: publicClient
  };
}; 