/// <reference types="node" />
import { parseEther, encodeFunctionData, createPublicClient, http, DecodeEventLogReturnType } from "viem";
import { baseSepolia, base } from "viem/chains";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Validates required environment variables are set
 */
function validateEnvironment(): void {
  const requiredVars = [
    'ALCHEMY_API_KEY',
    'COINBASE_API_KEY',
    'PRIVATE_KEY',
    'FACTORY_ADDRESS'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these variables in your .env file');
  }
}

validateEnvironment();

// Custom error class for POAP management specific errors
class POAPManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'POAPManagementError';
  }
}

// Utility function to load contract ABIs from files
const loadABI = (filePath: string) => 
  JSON.parse(fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));

// Load contract ABIs for factory and meeting contracts
const factoryABI = loadABI('../../contracts/deployed_nft_info/MeetingFactoryABI.json');
const meetingABI = loadABI('../../contracts/deployed_nft_info/meetingABI.json');

// Interface defining Meeting contract methods
interface IMeeting {
  mint(recipient: string, metadataURI: string): Promise<{ txHash: string, tokenId: string }>;
  batchMint(recipients: string[], metadataURIs: string[]): Promise<{ txHash: string, tokenIds: string[] }>;
  tokenURI(tokenId: number): Promise<string>;
  getNFTRecipients(): Promise<string[]>;
  getNFTTransfer(tokenId: number): Promise<string>;
  sessionName(): Promise<string>;
  metadataURL(): Promise<string>;
  creator(): Promise<string>;
}

// Helper function for bigint serialization
function bigIntReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export class POAPManagementService {
  private factoryAddress = process.env.FACTORY_ADDRESS!;
  private initialized = false;
  private accountClient: any;
  private publicClient: any;
  private contractCache: Map<string, IMeeting> = new Map();

  constructor() {
    this.initialize().catch(e => console.error("Initialization failed:", e));
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Dynamic imports with correct package paths
    const {
      createSmartAccountClient,
      erc7677Middleware,
      split,
      LocalAccountSigner
    } = await import("@aa-sdk/core");
    
    const {
      alchemyFeeEstimator,
      createAlchemyPublicRpcClient,
      alchemy
    } = await import("@account-kit/infra");

    const { http } = await import("viem");
    const { createModularAccountV2 } = await import("@account-kit/smart-contracts");

    // Get API keys and chain config from environment
    const alchemyApiKey = process.env.ALCHEMY_API_KEY!;
    const coinbaseApiKey = process.env.COINBASE_API_KEY!;
    const chainName = process.env.CHAIN || "base-sepolia";
    
    // Determine the chain configuration based on environment
    const chainConfig = chainName === "base-mainnet" ? base : baseSepolia;
    const chainNameForUrl = chainName === "base-mainnet" ? "base-mainnet" : "base-sepolia";
    
    // Construct RPC URLs dynamically based on chain
    const alchemyRpcUrl = `https://${chainNameForUrl}.g.alchemy.com/v2/${alchemyApiKey}`;
    const coinbaseRpcUrl = `https://api.developer.coinbase.com/rpc/v1/${chainNameForUrl}`;
    
    console.log(`Using chain: ${chainName}`);
    console.log(`Alchemy URL: ${alchemyRpcUrl}`);
    console.log(`Coinbase URL: ${coinbaseRpcUrl}`);

    // Create custom chain with configured RPC URLs
    const chain = {
      ...chainConfig,
      rpcUrls: {
        ...chainConfig.rpcUrls,
        default: {
          http: [alchemyRpcUrl]
        },
        alchemy: {
          http: [alchemyRpcUrl],
          webSocket: [`wss://${chainNameForUrl}.g.alchemy.com/v2/${alchemyApiKey}`]
        }
      }
    };
    
    // Get the private key from environment
    const privateKey = `0x${process.env.PRIVATE_KEY!.replace(/^0x/, '')}` as `0x${string}`;
    const signer = LocalAccountSigner.privateKeyToAccountSigner(privateKey);

    // Create transport with proper URL
    const alchemyTransport = alchemy({ rpcUrl: alchemyRpcUrl });
    
    // Create transport for Coinbase with headers for authentication
    const coinbaseTransport = http(coinbaseRpcUrl, {
      // Add the API key as a header
      fetchOptions: {
        headers: {
          "x-api-key": coinbaseApiKey,
          "Content-Type": "application/json"
        }
      }
    });
    
    // Create split transport with correct authentication
    const transport = split({
      overrides: [{
        methods: ["pm_getPaymasterStubData", "pm_getPaymasterData"],
        transport: coinbaseTransport
      }],
      fallback: alchemyTransport // Use Alchemy as fallback instead of Coinbase
    });

    // Create RPC client
    const alchemyRpcClient = createAlchemyPublicRpcClient({
      chain,
      transport: alchemyTransport
    });

    // Create account
    const account = await createModularAccountV2({
      mode: "default",
      chain,
      signer,
      transport: alchemyTransport
    });

    // Create client
    this.accountClient = createSmartAccountClient({
      transport,
      chain,
      account,
      feeEstimator: alchemyFeeEstimator(alchemyTransport)
    });

    // Set public client
    this.publicClient = alchemyRpcClient;
    this.initialized = true;
  }

  // Deploys a new meeting contract using the factory
  async deployMeeting(
    sessionName: string,
    metadataUri: string,
    creatorAddress: string,
    participantWallets: string[] = []
  ): Promise<{ meetingAddress: string; txHash: string }> {
    await this.initialize();

    try {
      // Encode deployment transaction data
      const deployData = encodeFunctionData({
        abi: factoryABI,
        functionName: "createMeeting",
        args: [
          sessionName,
          metadataUri,
          creatorAddress,
          [creatorAddress, await this.accountClient.getAddress(), ...participantWallets]
        ]
      });

      // Send and wait for user operation confirmation
      const uo = await this.accountClient.sendUserOperation({
        uo: {
          target: this.factoryAddress,
          data: deployData,
          value: 0n,
          maxFeePerGas: BigInt(process.env.MAX_FEE_PER_GAS || "100000000000"),
          maxPriorityFeePerGas: BigInt(process.env.MAX_PRIORITY_FEE_PER_GAS || "1500000000")
        }
      });

      // Get transaction hash and receipt
      const txHash = await this.accountClient.waitForUserOperationTransaction(uo);
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash });

      // Extract deployed contract address from logs
      const meetingAddress = this.extractDeployedAddress(receipt.logs);
      return { meetingAddress, txHash };
    } catch (error: any) {
      console.error(`Deployment failed: ${error.message}`);
      throw new POAPManagementError(`Deployment failed: ${error.message}`);
    }
  }

  // Extract deployed contract address from transaction logs
  private extractDeployedAddress(logs: any[]): string {
    try {
      // Look through logs from the factory contract
      for (const log of logs) {
        if (log.address.toLowerCase() === this.factoryAddress.toLowerCase()) {
          // Check topics for the contract address (common pattern)
          if (log.topics && log.topics.length > 1) {
            const topic = log.topics[1];
            if (topic && topic.length >= 42) {
              const addressFromTopic = '0x' + topic.substring(topic.length - 40);
              if (/^0x[0-9a-fA-F]{40}$/i.test(addressFromTopic)) {
                return addressFromTopic;
              }
            }
          }
          
          // Check event args for the address
          if (log.args) {
            const args = log.args;
            const possibleAddressArgs = [
              args.meetingAddress, 
              args.contractAddress, 
              args.newContract,
              args.contract,
              args.instance,
              args.meeting
            ];
            
            for (const arg of possibleAddressArgs) {
              if (arg && /^0x[0-9a-fA-F]{40}$/i.test(arg)) {
                return arg;
              }
            }
          }
          
          // As a last resort, scan the data for valid addresses
          if (log.data && log.data.length > 2) {
            const dataWithoutPrefix = log.data.startsWith('0x') ? log.data.substring(2) : log.data;
            
            // Search for valid addresses in the data
            const addresses = [];
            for (let i = 0; i < dataWithoutPrefix.length - 40; i += 2) {
              const potential = '0x' + dataWithoutPrefix.substring(i, i + 40);
              if (/^0x[0-9a-fA-F]{40}$/i.test(potential) && 
                  !potential.startsWith('0x000000000000000000000000')) {
                addresses.push(potential);
              }
            }
            
            if (addresses.length > 0) {
              return addresses[0];
            }
          }
        }
      }
      
      throw new POAPManagementError('Failed to extract meeting address from logs');
    } catch (error) {
      console.error("Error extracting address:", error);
      throw new POAPManagementError('Could not determine deployed contract address');
    }
  }

  // Get Meeting contract interface
  public async getMeetingContract(meetingAddress: string): Promise<IMeeting> {
      await this.initialize();
    
    // Normalize address
    const normalizedAddress = meetingAddress.toLowerCase();
    
    // Check cache first
    if (this.contractCache.has(normalizedAddress)) {
      return this.contractCache.get(normalizedAddress)!;
    }
    
    // Fix malformed addresses
    if (normalizedAddress.startsWith('0x0000000000000000000000')) {
      meetingAddress = '0x' + normalizedAddress.substring(26);
    }
    
    // Validate address format
    if (!/^0x[0-9a-fA-F]{40}$/i.test(meetingAddress)) {
      throw new POAPManagementError(`Invalid Ethereum address format: ${meetingAddress}`);
    }
    
    // Validate that the contract exists
    try {
      const code = await this.publicClient.getBytecode({
        address: meetingAddress
      });
      
      if (!code || code === '0x') {
        throw new POAPManagementError(`No contract at address ${meetingAddress}`);
      }
      
      const contractInstance = this.createMeetingInterface(meetingAddress);
      
      // Add to cache before returning
      this.contractCache.set(normalizedAddress, contractInstance);
      return contractInstance;
    } catch (error) {
      console.error(`Error validating contract at ${meetingAddress}:`, error);
      throw new POAPManagementError(`Cannot interact with contract at ${meetingAddress}`);
    }
  }

  // Create Meeting contract interface
  private createMeetingInterface(meetingAddress: string): IMeeting {
    const self = this;

    return {
      async mint(recipient: string, metadataURI: string) {
        try {
          // Normalize recipient address
          const formattedRecipient = recipient.toLowerCase();
          
          // Encode mint function call
          const mintData = encodeFunctionData({
            abi: meetingABI,
            functionName: "mint",
            args: [formattedRecipient, metadataURI]
          });

          // Execute mint operation
          const uo = await self.accountClient.sendUserOperation({
        uo: {
          target: meetingAddress,
              data: mintData,
              value: 0n
            }
          });

          // Get transaction hash
          const txHash = await self.accountClient.waitForUserOperationTransaction(uo);
          
          // Get current recipients to determine token ID
          const recipients = await self.readMeetingFunction(meetingAddress, "getNFTRecipients", []);
          const tokenId = (recipients.length - 1).toString();
          
          return { txHash, tokenId };
        } catch (error: any) {
          console.error(`Mint failed for recipient ${recipient}: ${error.message}`);
          throw new POAPManagementError(`Mint failed: ${error.message}`);
        }
      },

      // Add new batch mint implementation
      async batchMint(recipients: string[], metadataURIs: string[]) {
        try {
          if (recipients.length !== metadataURIs.length) {
            throw new POAPManagementError('Recipients and metadata URIs arrays must have the same length');
          }
          
          if (recipients.length === 0) {
            throw new POAPManagementError('No recipients provided for batch mint');
          }
          
          // Create an array of user operations (one for each mint)
          const operations = recipients.map((recipient, index) => {
            // Normalize recipient address
            const formattedRecipient = recipient.toLowerCase();
            
            // Encode mint function call
            const mintData = encodeFunctionData({
              abi: meetingABI,
              functionName: "mint",
              args: [formattedRecipient, metadataURIs[index]]
            });
            
            return {
              target: meetingAddress,
              data: mintData,
              value: 0n
            };
          });
          
          // Execute batch mint operation
          const uo = await self.accountClient.sendUserOperation({
            uo: operations
          });
          
          // Get transaction hash
          const txHash = await self.accountClient.waitForUserOperationTransaction(uo);
          
          // Get current recipients to determine token IDs
          const allRecipients = await self.readMeetingFunction(meetingAddress, "getNFTRecipients", []);
          
          // Calculate token IDs - they should be sequential from the last token before this batch
          const startingTokenId = allRecipients.length - recipients.length;
          const tokenIds = Array.from({ length: recipients.length }, (_, i) => (startingTokenId + i).toString());
          
          console.log(`Batch minted ${recipients.length} tokens with IDs: ${tokenIds.join(', ')}`);
          
          return { txHash, tokenIds };
    } catch (error: any) {
          console.error(`Batch mint failed: ${error.message}`);
          throw new POAPManagementError(`Batch mint failed: ${error.message}`);
        }
      },

      // Read-only contract methods
      async tokenURI(tokenId: number) {
        return self.readMeetingFunction(meetingAddress, "tokenURI", [tokenId]);
      },

      async getNFTRecipients() {
        return self.readMeetingFunction(meetingAddress, "getNFTRecipients", []);
      },

      async getNFTTransfer(tokenId: number) {
        return self.readMeetingFunction(meetingAddress, "getNFTTransfer", [tokenId]);
      },

      async sessionName() {
        return self.readMeetingFunction(meetingAddress, "sessionName", []);
      },

      async metadataURL() {
        return self.readMeetingFunction(meetingAddress, "metadataURL", []);
      },

      async creator() {
        return self.readMeetingFunction(meetingAddress, "creator", []);
      }
    };
  }

  // Helper method for reading contract data
  private async readMeetingFunction(
    meetingAddress: string,
    functionName: string,
    args: any[]
  ): Promise<any> {
    try {
      return await this.publicClient.readContract({
        address: meetingAddress,
        abi: meetingABI,
        functionName,
        args
      });
    } catch (error: any) {
      throw new POAPManagementError(`Read failed: ${error.message}`);
    }
  }

  // Get all meeting contracts from factory
  public async getAllMeetings(): Promise<string[]> {
      await this.initialize();
    return this.publicClient.readContract({
        address: this.factoryAddress,
        abi: factoryABI,
      functionName: 'getAllMeetings'
    }) as Promise<string[]>;
  }

  // Get meeting count from factory
  public async getMeetingCount(): Promise<number> {
      await this.initialize();
    return this.publicClient.readContract({
        address: this.factoryAddress,
        abi: factoryABI,
      functionName: 'getMeetingCount'
    }) as Promise<number>;
  }

  // Get account address
  public async getAccountAddress(): Promise<string> {
      await this.initialize();
    return this.accountClient.getAddress();
  }

  // Get comprehensive meeting information
  public async getMeeting(meetingAddress: string): Promise<any> {
    await this.initialize();
    
    try {
      const meetingContract = await this.getMeetingContract(meetingAddress);
      
      // Get basic info
      const [sessionName, creator, recipients, allMinters] = await Promise.all([
        meetingContract.sessionName(),
        meetingContract.creator(),
        meetingContract.getNFTRecipients(),
        this.getAllMintersFromEvents(meetingAddress)
      ]);
      
      // Get token info for each recipient
      const tokens = [];
      for (let i = 0; i < recipients.length; i++) {
        const tokenId = i;
        const tokenURI = await meetingContract.tokenURI(tokenId).catch(() => null);
        
        if (tokenURI) {
          tokens.push({
            tokenId,
            recipient: recipients[i],
            tokenURI
          });
        }
      }
      
      return {
        address: meetingAddress,
        sessionName,
        creator,
        recipients,
        minters: allMinters,
        tokens
      };
    } catch (error) {
      console.error(`Error getting meeting info: ${error}`);
      return null;
    }
  }

  // Get minters from events
  private async getAllMintersFromEvents(meetingAddress: string): Promise<string[]> {
    try {
      const logs = await this.publicClient.getLogs({
        address: meetingAddress,
        event: {
          type: 'event',
          name: 'MinterAdded',
          inputs: [{ type: 'address', name: 'minter', indexed: true }]
        },
        fromBlock: 'earliest'
      });
      
      return logs.map(log => log.args.minter);
    } catch (error) {
      console.error(`Error getting minters from events: ${error}`);
      return [];
    }
  }
}

// Export a singleton instance
const poapManagementService = new POAPManagementService();
export { poapManagementService };
export default POAPManagementService;