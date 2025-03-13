/// <reference types="node" />
import { parseEther, encodeFunctionData, createPublicClient, http, DecodeEventLogReturnType, createWalletClient, parseAbiItem, Account } from "viem";
import { base } from "viem/chains";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
  initialize as initializePaymaster,
  getClients
} from './paymaster.service';
import { MeetingDetails } from '../interfaces/meeting.interface';
import { TokenGateOptions } from '../interfaces/token-gate.interface';

dotenv.config();

/**
 * Validates required environment variables are set or uses defaults
 */
function validateEnvironment(): void {
  // Default values for environment variables if they're not set
  if (!process.env.ALCHEMY_API_KEY) {
    process.env.ALCHEMY_API_KEY = "IGIm76YSHqPtsMMGJx6jJKz-jVOM984p";
    console.log("Using default ALCHEMY_API_KEY");
  }
  
  if (!process.env.COINBASE_API_KEY) {
    process.env.COINBASE_API_KEY = "603VqKIrkttBshwLGv2WvOVVhU9ngnjH";
    console.log("Using default COINBASE_API_KEY");
  }
  
  if (!process.env.PRIVATE_KEY) {
    // Using a default test private key - do not use in production
    process.env.PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001";
    console.log("Using default PRIVATE_KEY (for testing only)");
  }
  
  console.log("ENV FACTORY_ADDRESS:", process.env.FACTORY_ADDRESS);
  if (!process.env.FACTORY_ADDRESS) {
    // Default factory address for Base Sepolia
    process.env.FACTORY_ADDRESS = "0x4b22f474C074D5fd3A80D727DdB2CB05A3649e54";
    console.log("Using default FACTORY_ADDRESS");
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
  balanceOf(address: string): Promise<number>;
}

// Helper function for bigint serialization
function bigIntReplacer(key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export class POAPManagementService {
  private accountClient: any;
  private publicClient: any;
  private initialized: boolean = false;
  private readonly factoryAddress = process.env.FACTORY_ADDRESS || '';
  private contractCache: Map<string, IMeeting> = new Map();

  constructor() {
    if (!this.factoryAddress) {
      throw new Error('Factory address not configured');
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Log the start of initialization process
      console.log('Starting POAP Management Service initialization...');
      
      // Log environment variables (redacted)
      console.log('Environment variables present: ', {
        paymasterUrl: process.env.PAYMASTER_URL ? 'Set' : 'Not set',
        paymasterApiKey: process.env.PAYMASTER_API_KEY ? 'Set' : 'Not set',
        rpcUrl: process.env.RPC_URL ? 'Set' : 'Not set',
        chainId: process.env.CHAIN_ID ? 'Set' : 'Not set'
      });
      
      if (this.initialized) return;
      
      console.log("Initializing POAP Management Service with paymaster...");
      
      // Initialize paymaster service
      await initializePaymaster();
      
      // Get clients from paymaster service
      const { accountClient, publicClient } = await getClients();
      
      // Set the clients
      this.accountClient = accountClient;
      this.publicClient = publicClient;
      
      // Verify the client has the required methods
      if (typeof this.accountClient.sendUserOperation !== 'function') {
        throw new Error("Paymaster client missing required sendUserOperation method");
        }
        
        // Get and log the account address to verify it's working
        const accountAddress = await this.accountClient.getAddress();
        console.log(`Successfully connected to paymaster client. Account address: ${accountAddress}`);

      this.initialized = true;
      console.log("POAPManagementService initialized with paymaster for gas sponsoring");
      console.log('POAP Management Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize POAP Management Service:', error);
      throw error;
    }
  }

  public async getAccountAddress(): Promise<string> {
    try {
      if (!this.initialized) {
    await this.initialize();
      }
      return await this.accountClient.getAddress();
    } catch (error) {
      console.error("Error getting account address:", error);
      throw error;
    }
  }

  public async getMeetingDetails(meetingAddress: string): Promise<any> {
    try {
      console.log(`Getting details for meeting at ${meetingAddress}...`);
      
      // Get contract instance
      const meetingContract = await this.getMeetingContract(meetingAddress);
      
      // Collect meeting data with better error handling
      let sessionNameValue = "Unknown Session";
      let metadataUrlValue = "";
      let creatorValue = "";
      let recipientsValue: string[] = [];
      
      try {
        sessionNameValue = await meetingContract.sessionName();
        console.log(`Session name: ${sessionNameValue}`);
      } catch (error) {
        console.warn(`Error getting session name for ${meetingAddress}:`, error);
      }
      
      try {
        metadataUrlValue = await meetingContract.metadataURL();
        console.log(`Metadata URL: ${metadataUrlValue}`);
      } catch (error) {
        console.warn(`Error getting metadata URL for ${meetingAddress}:`, error);
      }
      
      try {
        creatorValue = await meetingContract.creator();
        console.log(`Creator: ${creatorValue}`);
      } catch (error) {
        console.warn(`Error getting creator for ${meetingAddress}:`, error);
      }
      
      try {
        recipientsValue = await meetingContract.getNFTRecipients();
        console.log(`Found ${recipientsValue.length} recipients for ${meetingAddress}`);
      } catch (error) {
        console.warn(`Error getting recipients for ${meetingAddress}:`, error);
      }
      
      // Create a response object with all collected data
      const detailsResponse = {
        address: meetingAddress,
        sessionName: sessionNameValue,
        metadataURL: metadataUrlValue,
        creator: creatorValue,
        recipients: recipientsValue,
        isActive: true,
        recipientCount: recipientsValue.length
      };
      
      return detailsResponse;
    } catch (error) {
      console.error(`Error getting meeting details for ${meetingAddress}:`, error);
      
      // Return partial data with error indication
      return {
        address: meetingAddress,
        sessionName: "Error retrieving session",
        metadataURL: "",
        creator: "",
        recipients: [],
        isActive: false,
        recipientCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async deployMeeting(
    meetingDetails: MeetingDetails,
    tokenGateOptions?: TokenGateOptions,
  ): Promise<{ meetingAddress: string; txHash: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Deploy the meeting contract
      const { meetingAddress, txHash } = await this.deployMeetingContract(
        meetingDetails.sessionName,
        meetingDetails.metadataUri,
        meetingDetails.creatorAddress,
      );

      return { meetingAddress, txHash };
    } catch (error) {
      console.error("Error deploying meeting:", error);
      throw error;
    }
  }

  public async getUserTokenGateOptions(walletAddress: string): Promise<TokenGateOptions[]> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get all meetings
      const meetings = await this.getAllMeetings();

      // Check which meetings this wallet has NFTs for
      const tokenGateOptions = [];
      for (const meetingAddress of meetings) {
        const hasNFT = await this.walletHasMeetingNFT(walletAddress, meetingAddress);
        if (hasNFT) {
          const details = await this.getMeetingDetails(meetingAddress);
          tokenGateOptions.push({
            meetingAddress,
            chainNetwork: "Base Mainnet",
            status: "Active"
          });
        }
      }

      return tokenGateOptions;
    } catch (error) {
      console.error("Error getting user token gate options:", error);
      throw error;
    }
  }

  private async getMeetingContract(meetingAddress: string): Promise<IMeeting> {
    try {
      // Check if contract is already in cache
      if (this.contractCache.has(meetingAddress)) {
        return this.contractCache.get(meetingAddress)!;
      }

      // Normalize address
      const formattedAddress = meetingAddress.toLowerCase();
      console.log(`Getting meeting contract at ${formattedAddress}...`);

      // Validate that the contract exists
      try {
        // Check if the contract exists and has code
        const contractCode = await this.publicClient.getBytecode({
          address: formattedAddress as `0x${string}`
        });

        if (!contractCode || contractCode === '0x') {
          console.error(`No contract bytecode found at address ${formattedAddress}`);
          
          // Try to get meeting data from factory contract
          console.log(`Trying to get meeting info from factory contract for ${formattedAddress}...`);
          
          // Get meeting info from factory
          const meetingInfo = await this.getMeetingInfoFromFactory(formattedAddress);
          console.log(`Got meeting info from factory for ${formattedAddress}:`, meetingInfo);
          
          // Use factory data but throw error for operations
          const factoryMeetingInterface = this.createFactoryBasedMeetingInterface(formattedAddress, meetingInfo);
          this.contractCache.set(formattedAddress, factoryMeetingInterface);
          return factoryMeetingInterface;
        }
      } catch (error) {
        console.error(`Error validating contract at ${formattedAddress}:`, error);
        throw new POAPManagementError(`Cannot interact with contract at ${meetingAddress}`);
      }

      // Create meeting interface
      const meetingInterface = this.createMeetingInterface(formattedAddress);
      this.contractCache.set(formattedAddress, meetingInterface);

      return meetingInterface;
    } catch (error) {
      console.error(`Error getting meeting contract at ${meetingAddress}:`, error);
      throw new POAPManagementError(`Cannot interact with contract at ${meetingAddress}`);
    }
  }

  // Get meeting info from factory contract
  private async getMeetingInfoFromFactory(meetingAddress: string): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log(`Attempting to get meeting info for ${meetingAddress} from factory at ${this.factoryAddress}`);
      
      // Get the factory contract
      const factoryContract = await this.getFactoryContract();
      
      // There are different approaches to get meeting info depending on factory implementation
      let meetingInfo;
      
      // Approach 1: Try getMeetingInfo if it exists
      try {
        meetingInfo = await this.publicClient.readContract({
          ...factoryContract,
          functionName: "getMeetingInfo",
          args: [meetingAddress],
        });
        console.log(`Found meeting info using getMeetingInfo: ${JSON.stringify(meetingInfo)}`);
        return meetingInfo;
      } catch (infoError) {
        console.log(`getMeetingInfo not available or failed: ${infoError}`);
      }
      
      // Approach 2: Try getMeetingByAddress if it exists
      try {
        meetingInfo = await this.publicClient.readContract({
          ...factoryContract,
          functionName: "getMeetingByAddress",
          args: [meetingAddress],
        });
        console.log(`Found meeting info using getMeetingByAddress: ${JSON.stringify(meetingInfo)}`);
        return meetingInfo;
      } catch (byAddressError) {
        console.log(`getMeetingByAddress not available or failed: ${byAddressError}`);
      }
      
      // Approach 3: Try to find the meeting in the list of all meetings
      try {
        const allMeetings = await this.getAllMeetings();
        console.log(`Retrieved ${allMeetings.length} meetings from factory`);
        
        // If meetingAddress is in the list, we know it exists
        if (allMeetings.includes(meetingAddress.toLowerCase())) {
          console.log(`Meeting ${meetingAddress} found in all meetings list`);
          
          // Try to get creator from deployment events
          try {
            const creator = await this.getMeetingCreator(meetingAddress);
            return {
              address: meetingAddress,
              creator,
              // Other fields may not be available, but at least we know the meeting exists and who created it
            };
          } catch (creatorError) {
            console.log(`Could not get creator for ${meetingAddress}: ${creatorError}`);
            return {
              address: meetingAddress,
              // At minimum we know the meeting exists in the factory
            };
          }
        }
      } catch (allMeetingsError) {
        console.log(`Could not get all meetings: ${allMeetingsError}`);
      }
      
      // If we got here, we couldn't get any specific meeting info
      throw new Error(`Could not get meeting info for ${meetingAddress} from factory`);
    } catch (error) {
      console.error(`Error getting meeting info from factory for ${meetingAddress}:`, error);
      throw error;
    }
  }

  // Helper to get meeting creator from events
  private async getMeetingCreator(meetingAddress: string): Promise<string> {
    try {
      // Check for MeetingDeployed events that mention this address
      const factoryContract = await this.getFactoryContract();
      const filter = await this.publicClient.createEventFilter({
        address: factoryContract.address,
        event: parseAbiItem('event MeetingDeployed(address indexed meetingAddress, address indexed creator, string sessionName)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
        args: {
          meetingAddress: meetingAddress as `0x${string}`
        }
      });
      
      const logs = await this.publicClient.getFilterLogs({ filter });
      
      if (logs && logs.length > 0) {
        // Find the deployment event and get the creator
        const deployEvent = logs.find(log => 
          log.args.meetingAddress?.toLowerCase() === meetingAddress.toLowerCase()
        );
        
        if (deployEvent && deployEvent.args.creator) {
          return deployEvent.args.creator.toString();
        }
      }
      
      throw new Error('Meeting creator not found in events');
    } catch (error) {
      console.error(`Error getting meeting creator for ${meetingAddress}:`, error);
      throw error;
    }
  }

  // Create a meeting interface based on data from factory contract - for read-only operations
  private createFactoryBasedMeetingInterface(meetingAddress: string, meetingInfo: any): IMeeting {
    console.log(`Creating factory-based interface for contract at ${meetingAddress}`);
    
    // Extract data from meetingInfo
    const creatorAddress = meetingInfo.creator || meetingInfo[0];
    const sessionNameValue = meetingInfo.sessionName || meetingInfo[1];
    const metadataURIValue = meetingInfo.metadataURI || meetingInfo[2];
    
    if (!creatorAddress) {
      throw new POAPManagementError(`Invalid meeting info from factory for ${meetingAddress}`);
    }
    
    // Capture this for use in the interface methods
    const self = this;
    
    return {
      async mint(recipient: string, metadataURI: string) {
        throw new POAPManagementError(`Cannot mint tokens: Contract at ${meetingAddress} cannot be accessed directly`);
      },
      async batchMint(recipients: string[], metadataURIs: string[]) {
        throw new POAPManagementError(`Cannot batch mint tokens: Contract at ${meetingAddress} cannot be accessed directly`);
      },
      async tokenURI(tokenId: number) {
        return metadataURIValue;
      },
      async getNFTRecipients() {
        // Get recipients from events if available
        try {
          const recipients = await self.getAllMintersFromEvents(meetingAddress);
          return recipients;
        } catch (error) {
          return [];
        }
      },
      async getNFTTransfer(tokenId: number) {
        throw new POAPManagementError(`Cannot get token transfers: Contract at ${meetingAddress} cannot be accessed directly`);
      },
      async sessionName() {
        return sessionNameValue;
      },
      async metadataURL() {
        return metadataURIValue;
      },
      async creator() {
        return creatorAddress;
      },
      async balanceOf(address: string) {
        throw new POAPManagementError(`Cannot check balance: Contract at ${meetingAddress} cannot be accessed directly`);
      }
    };
  }

  private async deployMeetingContract(
    sessionName: string,
    metadataUri: string,
    creatorAddress: string,
  ): Promise<{ meetingAddress: string; txHash: string }> {
    try {
      const factoryContract = await this.getFactoryContract();
      
      // Encode deployment call
      const callData = encodeFunctionData({
        abi: factoryABI,
        functionName: "createMeeting",
        args: [sessionName, metadataUri, creatorAddress, []]
      });

      // Send transaction through paymaster
      const uoHash = await this.accountClient.sendUserOperation({
        target: this.factoryAddress,
        data: callData,
        value: 0n
      });

      // Wait for transaction
      const txHash = await this.accountClient.waitForUserOperationTransaction(uoHash);
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash });

      // Extract deployed address from logs
      const meetingAddress = receipt.logs[0].address;
      
      console.log(`Meeting deployed at: ${meetingAddress}`);
      return { meetingAddress, txHash };
    } catch (error) {
      console.error("Error deploying meeting contract:", error);
      throw error;
    }
  }

  private async getAllMeetings(): Promise<string[]> {
    try {
      if (!this.initialized) {
    await this.initialize();
      }

      // Get the factory contract
      const factoryContract = await this.publicClient.getContract({
        address: this.factoryAddress,
        abi: [], // Add your factory contract ABI here
      });

      // Get all meetings
      return await factoryContract.getAllMeetings();
    } catch (error) {
      console.error("Error getting all meetings:", error);
      throw error;
    }
  }

  private async walletHasMeetingNFT(walletAddress: string, meetingAddress: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get the meeting contract
      const meetingContract = await this.getMeetingContract(meetingAddress);

      // Check if the wallet has an NFT
      const balance = await meetingContract.balanceOf(walletAddress);
      return balance > 0;
    } catch (error) {
      console.error(`Error checking NFT balance for ${walletAddress} at ${meetingAddress}:`, error);
      throw error;
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

          console.log(`Minting token for ${formattedRecipient} using paymaster for gas sponsoring...`);
          
          // Execute mint operation with gas sponsoring via paymaster
          try {
            // Send the user operation with the correct format for ModularAccountV2Client
            const uo = await self.accountClient.sendUserOperation({
              uo: {
                target: meetingAddress,
                data: mintData,
                value: 0n
              }
            });

            console.log(`Mint operation sent, waiting for confirmation...`);
            
            // Get transaction hash
            const txHash = await self.accountClient.waitForUserOperationTransaction(uo);
            console.log(`Mint transaction confirmed with hash: ${txHash}`);
            
            // Get current recipients to determine token ID
            const recipients = await self.readMeetingFunction(meetingAddress, "getNFTRecipients", []);
            const tokenId = (recipients.length - 1).toString();
            
            console.log(`Successfully minted token ${tokenId} to ${formattedRecipient}`);
            return { txHash, tokenId };
          } catch (gasError) {
            console.error("Gas sponsoring error during mint:", gasError);
            throw new POAPManagementError(`Gas sponsoring failed during mint: ${gasError instanceof Error ? gasError.message : String(gasError)}`);
          }
        } catch (error: any) {
          console.error(`Mint failed for recipient ${recipient}: ${error.message}`);
          throw new POAPManagementError(`Mint failed: ${error.message}`);
        }
      },

      // Batch mint implementation
      async batchMint(recipients: string[], metadataURIs: string[]) {
        try {
          if (recipients.length !== metadataURIs.length) {
            throw new POAPManagementError('Recipients and metadata URIs arrays must have the same length');
          }
          
          if (recipients.length === 0) {
            throw new POAPManagementError('No recipients provided for batch mint');
          }
          
          console.log(`Batch minting tokens for ${recipients.length} recipients using paymaster for gas sponsoring...`);
          
          // Create an array of operations for batch minting
          const operations = [];
          
          for (let i = 0; i < recipients.length; i++) {
            // Normalize recipient address
            const formattedRecipient = recipients[i].toLowerCase();
            
            // Encode mint function call
            const mintData = encodeFunctionData({
              abi: meetingABI,
              functionName: "mint",
              args: [formattedRecipient, metadataURIs[i]]
            });
            
            operations.push({
              target: meetingAddress,
              data: mintData,
              value: 0n
            });
          }
          
          // Execute batch mint operation with gas sponsoring via paymaster
          try {
            console.log(`Sending batch of ${operations.length} mint operations...`);
            
            // Using the ModularAccountV2Client format for batch operations
            const uo = await self.accountClient.sendUserOperation({
              uo: operations
            });
            
            console.log(`Batch mint operation sent, waiting for confirmation...`);
            
            // Get transaction hash
            const txHash = await self.accountClient.waitForUserOperationTransaction(uo);
            console.log(`Batch mint transaction confirmed with hash: ${txHash}`);
            
            // Get current recipients to determine token IDs
            const allRecipients = await self.readMeetingFunction(meetingAddress, "getNFTRecipients", []);
            
            // Calculate token IDs - they should be sequential from the last token before this batch
            const startingTokenId = allRecipients.length - recipients.length;
            const tokenIds = Array.from({ length: recipients.length }, (_, i) => (startingTokenId + i).toString());
            
            console.log(`Successfully batch minted ${recipients.length} tokens with IDs: ${tokenIds.join(', ')}`);
            
            return { txHash, tokenIds };
          } catch (gasError) {
            console.error("Gas sponsoring error during batch mint:", gasError);
            throw new POAPManagementError(`Gas sponsoring failed during batch mint: ${gasError instanceof Error ? gasError.message : String(gasError)}`);
          }
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
      },

      async balanceOf(address: string) {
        return self.readMeetingFunction(meetingAddress, "balanceOf", [address]);
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
      throw new POAPManagementError(`Read failed for ${functionName}: ${error.message}`);
    }
  }

  // Get meeting count from factory
  public async getMeetingCount(): Promise<number> {
    await this.initialize();
    try {
      return this.publicClient.readContract({
        address: this.factoryAddress,
        abi: factoryABI,
        functionName: 'getMeetingCount'
      }) as Promise<number>;
    } catch (error: any) {
      console.error(`Failed to get meeting count: ${error.message}`);
      return 0;
    }
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
      console.error(`Error getting meeting info for ${meetingAddress}: ${error}`);
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
      console.error(`Error getting minters from events for ${meetingAddress}: ${error}`);
      return [];
    }
  }

  // Add this helper method to get the factory contract
  private async getFactoryContract(): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const factoryABI = loadABI('../abi/PodxMeetingFactory.json');
      
      // Return the contract interface
      return {
        address: this.factoryAddress as `0x${string}`,
        abi: factoryABI,
      };
    } catch (error) {
      console.error('Error getting factory contract:', error);
      throw error;
    }
  }
}