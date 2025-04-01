# POAP Services Documentation

This document provides an overview of the POAP (Proof of Attendance Protocol) related services that were previously part of the PodX server codebase. These services are planned to be rewritten but this documentation preserves knowledge about their functionality and integration.

## Overview

The POAP system in PodX allowed for the creation and management of NFT-based proof of attendance tokens for calls and meetings. It integrated with blockchain technologies using Base Sepolia network and various web3 services.

## Services Architecture

The POAP functionality was composed of the following services:

### 1. `poap.service.ts`

This service handled the high-level POAP operations related to call attendance:

- **Main functionality**: 
  - Generated POAPs for eligible call participants
  - Determined eligibility based on call duration and participation
  - Managed POAP record creation in MongoDB
  - Interacted with blockchain through the POAP Management Service

- **Key methods**:
  - `handleCallPOAP(callId)`: Main entry point for POAP generation after a call ends
  - `getEligibleParticipants(call)`: Determined which users qualified for POAPs
  - `walletHasMeetingNFT(walletAddress, meetingAddress)`: Checked if a wallet owned a POAP
  - `deployMeeting(meetingDetails)`: Created a new POAP contract

- **Dependencies**:
  - MongoDB models (Call, User, POAP)
  - POAPManagementService for blockchain interactions
  - SmartAccount functionality from PaymasterService

### 2. `poap_management.service.ts` / `poap_management_service.ts`

These services handled the blockchain/web3 interactions for POAP NFTs:

- **Main functionality**:
  - Created and deployed POAP contracts on Base Sepolia blockchain
  - Minted NFTs to participant wallets
  - Managed token metadata 
  - Interfaced with the Account Abstraction SDK

- **Key methods**:
  - `initialize()`: Set up connections to blockchain with authentication
  - `deployMeeting()`: Deployed a new POAP meeting contract
  - `getMeetingContract()`: Retrieved contract interfaces
  - `mint(recipient, metadataURI)`: Minted tokens to recipients 
  - `readMeetingFunction()`: Read data from blockchain contracts

- **Dependencies**:
  - Viem library for blockchain interactions
  - Account Kit / Account Abstraction SDK
  - PaymasterService for smart account operations

### 3. `paymaster.service.ts`

This service handled the smart account and gas payment functionality:

- **Main functionality**:
  - Created and managed smart accounts
  - Provided gas sponsorship for transactions
  - Handled transaction signing and execution

- **Key methods**:
  - `createSmartAccount()`: Created a smart wallet using a private key
  - `getSmartAccountAddress()`: Retrieved the smart account address
  - `encodeFunctionCall()`: Prepared function call data
  - `readContract()`: Read data from contracts
  - `getClients()`: Provided client objects for transactions

- **Dependencies**:
  - Viem for blockchain interactions
  - Base network configuration

### 4. `metadata.service.ts`

This service handled NFT metadata generation and IPFS interactions:

- **Main functionality**:
  - Generated unique metadata for each POAP
  - Uploaded images and metadata to IPFS via Pinata
  - Provided metadata URIs for minting

- **Key methods**:
  - `generateAndUploadMetadata()`: Created and uploaded metadata for a call participant
  - `getExistingMetadata()`: Retrieved previously uploaded metadata

- **Dependencies**:
  - Pinata SDK for IPFS interactions
  - Call and User data for metadata generation

## Integration Points

The POAP services integrated with other parts of the system:

1. **Call Service**: When a call ended, it triggered the POAP generation process
2. **User Service**: To assign POAPs to users and their wallets
3. **Database Models**: Stored POAP records and their status
4. **External Services**:
   - Pinata for IPFS storage
   - Base Sepolia blockchain for smart contracts
   - Coinbase and Alchemy for RPC access and paymaster functionality

## Environment Configuration

The services required the following environment variables:

```
# Blockchain
ALCHEMY_API_KEY=your_alchemy_api_key
COINBASE_API_KEY=your_coinbase_api_key
PRIVATE_KEY=your_private_key
FACTORY_ADDRESS=your_factory_contract_address
CHAIN=base-sepolia

# POAP Criteria
MIN_PARTICIPANT_DURATION=30
MIN_PARTICIPANTS=2
MIN_CALL_DURATION=60

# IPFS
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_pinata_gateway
CLOUDINARY_POAP_URL=your_cloudinary_url
```

## Planned Improvements for Rewrite

The POAP services rewrite should consider:

1. Better error handling and transaction retries
2. Improved caching for blockchain interactions
3. Optimization of batch operations
4. More robust eligibility criteria
5. Enhanced metadata generation with more customization
6. Better test coverage and mocking for blockchain operations
7. Simplified architecture with clearer separation of concerns
8. Updated dependencies and modern web3 patterns

## Contract ABIs

The services relied on contract ABIs stored in:
- `contracts/deployed_nft_info/MeetingFactoryABI.json`
- `contracts/deployed_nft_info/meetingABI.json`

These should be preserved for reference in the rewrite. 