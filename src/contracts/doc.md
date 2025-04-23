# PODX POAP System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Smart Contracts](#smart-contracts)
3. [TypeScript Services](#typescript-services)
4. [Integration Flow](#integration-flow)
5. [Deployment Guide](#deployment-guide)
6. [Troubleshooting](#troubleshooting)

## 1. System Overview

The PODX POAP (Proof of Attendance Protocol) system is a comprehensive solution that enables the creation, management, and distribution of NFTs for meeting attendance. The system consists of:

- Smart Contracts (Solidity)
- Backend Services (TypeScript)
- Integration Layer

### Architecture Components:

```
PODX POAP System/
├── Smart Contracts/
│   ├── MeetingFactory.sol     # Factory contract for deploying Meeting contracts
│   ├── Meeting.sol            # Individual meeting NFT contract
│   └── interfaces/
│       └── IMeeting.sol       # Interface for Meeting contract
├── TypeScript Services/
│   ├── paymaster.service.ts   # Handles gas fee sponsorship
│   ├── poap_management.service.ts  # Core POAP operations
│   └── poap.service.ts        # High-level POAP business logic
└── Deployment Info/
    └── deployed_nft_info/     # Contract ABIs and deployment info
```

## 2. Smart Contracts

### MeetingFactory Contract

The MeetingFactory contract is the entry point for creating new meeting NFT contracts.

#### Key Functions:

```solidity
function createMeeting(
    string memory sessionName,
    string memory metadataURL,
    address creator,
    address[] memory minters
) public returns (address)
```

- Creates a new Meeting contract instance
- Records the meeting in the factory's registry
- Emits a MeetingCreated event
- Returns the address of the new Meeting contract

#### Transaction Tracking:

```solidity
function recordMint(address from, address to, uint256 tokenId)
function recordTransfer(address from, address to, uint256 tokenId)
```

- Records all mint and transfer operations
- Maintains a global transaction history
- Enables transaction querying and tracking

### Meeting Contract

Individual NFT contract for each meeting instance.

#### Key Functions:

```solidity
function mint(address recipient, string calldata metadataURI) 
    external returns (uint256)
```

- Mints a new NFT for a meeting participant
- Assigns unique metadata URI
- Records original recipient
- Returns token ID

#### Metadata Management:

```solidity
function tokenURI(uint256 tokenId) public view returns (string memory)
function getNFTRecipients() external view returns (address[] memory)
function getNFTTransfer(uint256 tokenId) external view returns (address)
```

## 3. TypeScript Services

### PaymasterService (paymaster.service.ts)

Handles gas fee sponsorship and account abstraction.

#### Key Features:

1. Smart Account Management:
```typescript
const createSmartAccount = async () => {
    // Creates or retrieves cached smart account
    // Manages private key and account setup
}
```

2. Client Configuration:
```typescript
const publicClient = createPublicClient({
    chain: base,
    transport: http(RPC_URL)
});

const walletClient = createWalletClient({
    chain: base,
    transport: http(RPC_URL)
});
```

### POAPManagementService (poap_management.service.ts)

Core service for POAP operations and blockchain interactions.

#### Key Operations:

1. Meeting Deployment:
```typescript
async deployMeeting({
    sessionName,
    metadataUri,
    creatorAddress
}): Promise<{ meetingAddress: string; txHash: string }>
```

2. NFT Minting:
```typescript
async mint(recipient: string, metadataURI: string): 
    Promise<{ txHash: string; tokenId: string }>
```

3. Contract Interaction:
```typescript
async getMeetingDetails(meetingAddress: string): 
    Promise<MeetingDetails>
```

### POAPService (poap.service.ts)

High-level business logic for POAP management.

#### Key Features:

1. Call POAP Handling:
```typescript
public static async handleCallPOAP(callId: string): Promise<void>
```
- Validates call eligibility
- Processes participant data
- Manages POAP distribution

2. Eligibility Checking:
```typescript
private static async getEligibleParticipants(call: any): Promise<any[]>
```
- Validates participation duration
- Checks minimum requirements
- Filters eligible participants

## 4. Integration Flow

1. Call Completion:
   - Call ends in the system
   - POAPService.handleCallPOAP is triggered

2. Eligibility Check:
   - Validate call duration (MIN_CALL_DURATION)
   - Check participant count (MIN_PARTICIPANTS)
   - Calculate individual participation times

3. Contract Deployment:
   - POAPService calls POAPManagementService
   - POAPManagementService uses PaymasterService for gas-free deployment
   - MeetingFactory deploys new Meeting contract

4. NFT Minting:
   - Generate metadata for eligible participants
   - Batch mint NFTs using smart account
   - Record transactions in the factory

## 5. Deployment Guide

1. Environment Setup:
```bash
# Required Environment Variables

COINBASE_API_KEY=your_coinbase_key
PRIVATE_KEY=your_private_key
FACTORY_ADDRESS=deployed_factory_address of the meetingfactory 
```

2. Contract Deployment:
   - Deploy MeetingFactory first
   - Record factory address in environment
   - Initialize PaymasterService

3. Service Configuration:
   - Configure RPC endpoints
   - Set up smart account
   - Initialize POAP services

## 6. Troubleshooting

### Common Issues:

1. Gas Fee Issues:
   - Check PaymasterService configuration
   - Verify smart account balance
   - Confirm API keys are valid

2. Contract Deployment Failures:
   - Verify factory address
   - Check transaction parameters
   - Review gas settings

3. NFT Minting Problems:
   - Validate recipient addresses
   - Check metadata URI format
   - Verify minter permissions

### Monitoring:

1. Transaction Tracking:
```typescript
const txHash = await accountClient.waitForUserOperationTransaction(uo);
const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
```

2. Error Logging:
```typescript
logger.error(`Error handling POAP for call ${callId}:`, error);
```

### Best Practices:

1. Always verify contract addresses before interaction
2. Use proper error handling and logging
3. Implement retry mechanisms for failed transactions
4. Maintain proper gas fee management
5. Regular monitoring of smart account balance

## Security Considerations

1. Private Key Management:
   - Secure storage of private keys
   - Regular key rotation
   - Environment variable protection

2. Access Control:
   - Proper minter permission management
   - Role-based access control
   - Input validation

3. Gas Management:
   - Gas price monitoring
   - Transaction fee limits
   - Proper error handling for out-of-gas scenarios
