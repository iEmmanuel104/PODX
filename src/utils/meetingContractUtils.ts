import { createPublicClient, http, decodeEventLog } from 'viem'
import { baseSepolia } from 'viem/chains'
import { toCoinbaseSmartAccount, createBundlerClient } from 'viem/account-abstraction'
import { privateKeyToAccount } from 'viem/accounts'
import { config } from 'dotenv'
import meetingFactoryMetadata from '../contracts/artifacts/MeetingFactory_metadata.json'
import meetingMetadata from '../contracts/artifacts/Meeting_metadata.json'

// Load environment variables first
config()

// Get environment variables and RPC URL
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith('0x') 
    ? process.env.PRIVATE_KEY as `0x${string}` 
    : `0x${process.env.PRIVATE_KEY}` as `0x${string}`
const COINBASE_API_KEY = process.env.COINBASE_API_KEY
const RPC_URL = `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${COINBASE_API_KEY}`

// Log environment variables for debugging
console.log('\nEnvironment Variables:')
console.log('FACTORY_ADDRESS:', FACTORY_ADDRESS)
console.log('PRIVATE_KEY:', PRIVATE_KEY ? '✅ Set' : '❌ Missing')
console.log('COINBASE_API_KEY:', COINBASE_API_KEY ? '✅ Set' : '❌ Missing')
console.log('RPC_URL:', RPC_URL)

if (!FACTORY_ADDRESS || !PRIVATE_KEY || !COINBASE_API_KEY) {
    throw new Error('Missing required environment variables. Please check FACTORY_ADDRESS, PRIVATE_KEY, and COINBASE_API_KEY')
}

// Create public client
const client = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
})

// Create owner account from private key
const owner = privateKeyToAccount(PRIVATE_KEY)

// Create smart account and bundler client
const getClients = async () => {
    try {
        // Create Coinbase smart wallet using an EOA signer
        const account = await toCoinbaseSmartAccount({
            client,
            owners: [owner]
        })

        // Log the deterministic public address
        console.log(`Using smart account address: ${account.address}`)

        // The bundler is a special node that gets your UserOperation on chain
        const bundlerClient = createBundlerClient({
            account,
            client,
            transport: http(RPC_URL),
            chain: baseSepolia
        })

        // Pads the preVerificationGas to ensure UserOperation lands onchain
        account.userOperation = {
            estimateGas: async (userOperation) => {
                // @ts-ignore - This matches the official example
                const estimate = await bundlerClient.estimateUserOperationGas(userOperation)
                // adjust preVerification upward
                estimate.preVerificationGas = estimate.preVerificationGas * 2n
                return estimate
            }
        }

        return { account, bundlerClient }
    } catch (error) {
        console.error('Error creating clients:', error)
        throw error
    }
}

interface CreateMeetingParams {
    sessionName: string
    metadataURL: string
    creator: `0x${string}`
    minters: `0x${string}`[]
}

interface MintTokenParams {
    meetingAddress: `0x${string}`
    recipient: `0x${string}`
    metadataURI: string
}

interface DeployAndMintParams {
    sessionName: string
    metadataURL: string
    creator: `0x${string}`
    minters: `0x${string}`[]
    recipientAddress: `0x${string}`
}

/**
 * Utility class for Meeting contract interactions using Coinbase Paymaster
 */
export class MeetingContractUtils {
    static getClients = getClients;

    /**
     * Deploy a meeting contract and mint a token in one operation
     * @param params Combined parameters for deployment and minting
     * @returns Object containing deployment and minting transaction details
     */
    static async deployAndMint(params: DeployAndMintParams) {
        try {
            const { sessionName, metadataURL, creator, minters, recipientAddress } = params
            const { account } = await getClients()
            const smartAccountAddress = account.address

            console.log('\n🚀 Starting Deploy & Mint Operation')
            console.log('Smart Account:', smartAccountAddress)
            console.log('\n📝 Parameters:')
            console.log('Session Name:', sessionName)
            console.log('Metadata URL:', metadataURL)
            console.log('Creator:', creator)
            console.log('Minters:', minters)
            console.log('Recipient:', recipientAddress)

            // First deploy the contract
            const { meetingAddress } = await this.deployMeeting({
                sessionName,
                metadataURL,
                creator,
                minters: [...minters, smartAccountAddress] // Ensure smart account can mint
            })

            if (!meetingAddress) {
                throw new Error('Meeting contract deployment failed: No meeting address returned')
            }

            console.log('\n🏗️ Contract Deployed Successfully')
            console.log('Meeting Address:', meetingAddress)

            // Then mint the token
            const mintTxHash = await this.mintToken({
                meetingAddress,
                recipient: recipientAddress,
                metadataURI: metadataURL
            })

            console.log('\n🎉 Operation Complete!')
            console.log('Contract:', meetingAddress)
            console.log('Mint Transaction:', mintTxHash)

            return {
                meetingAddress,
                mintTxHash,
                success: true
            }

        } catch (error) {
            console.error('Deploy and mint operation failed:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Deploy a new Meeting contract through the factory
     * @param params Meeting creation parameters
     * @returns Transaction receipt containing deployment logs
     */
    static async deployMeeting(params: CreateMeetingParams) {
        try {
            const { sessionName, metadataURL, creator, minters } = params
            const { account, bundlerClient } = await getClients()

            console.log('\n📝 Deployment Parameters:')
            console.log('Session Name:', sessionName)
            console.log('Metadata URL:', metadataURL)
            console.log('Creator:', creator)
            console.log('Minters:', minters)

            // Prepare the contract call
            const createMeetingCall = {
                abi: meetingFactoryMetadata.output.abi,
                functionName: 'createMeeting',
                to: FACTORY_ADDRESS,
                args: [sessionName, metadataURL, creator, minters]
            }

            // Sign and send the UserOperation
            const userOpHash = await bundlerClient.sendUserOperation({
                account,
                calls: [createMeetingCall],
                paymaster: true
            })

            // Wait for receipt and get transaction hash
            const receipt = await bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash
            })

            // Find and decode the MeetingCreated event
            const meetingCreatedEvent = receipt.receipt.logs.find(log => {
                try {
                    const event = decodeEventLog({
                        abi: meetingFactoryMetadata.output.abi,
                        data: log.data,
                        topics: log.topics
                    })
                    return event.eventName === 'MeetingCreated'
                } catch {
                    return false
                }
            })

            if (!meetingCreatedEvent) {
                throw new Error('Meeting contract deployment failed: MeetingCreated event not found in logs')
            }

            // Decode the event to get the meeting address
            const decodedEvent = decodeEventLog({
                abi: meetingFactoryMetadata.output.abi,
                data: meetingCreatedEvent.data,
                topics: meetingCreatedEvent.topics
            })

            const meetingAddress = (decodedEvent.args as any).meetingAddress as `0x${string}`

            console.log("\n✅ Meeting Contract Deployment Success!")
            console.log('📍 Meeting Contract Address:', meetingAddress)
            console.log(`⛽ View sponsored UserOperation: https://base-sepolia.blockscout.com/op/${receipt.userOpHash}`)
            console.log(`🔍 View transaction: https://sepolia.basescan.org/tx/${receipt.receipt.transactionHash}`)

            return {
                meetingAddress,
                receipt: receipt.receipt
            }
        } catch (error) {
            console.error('Meeting deployment error:', error)
            throw error
        }
    }

    /**
     * Mint a token for a specific meeting
     * @param params Token minting parameters
     * @returns Transaction hash
     */
    static async mintToken(params: MintTokenParams): Promise<`0x${string}`> {
        try {
            const { meetingAddress, recipient, metadataURI } = params
            const { account, bundlerClient } = await getClients()

            console.log('\n🎫 Minting Parameters:')
            console.log('Meeting Contract:', meetingAddress)
            console.log('Recipient:', recipient)
            console.log('Metadata URI:', metadataURI)

            // Prepare the mint call
            const mintCall = {
                abi: meetingMetadata.output.abi,
                functionName: 'mint',
                to: meetingAddress,
                args: [recipient, metadataURI]
            }

            // Sign and send the UserOperation
            const userOpHash = await bundlerClient.sendUserOperation({
                account,
                calls: [mintCall],
                paymaster: true
            })

            // Wait for receipt
            const receipt = await bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash
            })

            console.log("\n✅ Token Mint Success!")
            console.log('🏠 Meeting Contract:', meetingAddress)
            console.log('📬 Recipient:', recipient)
            console.log(`⛽ View sponsored UserOperation: https://base-sepolia.blockscout.com/op/${receipt.userOpHash}`)
            console.log(`🔍 View NFT: https://sepolia.basescan.org/token/${meetingAddress}`)

            return receipt.receipt.transactionHash
        } catch (error) {
            console.error('Token minting error:', error)
            throw error
        }
    }
}