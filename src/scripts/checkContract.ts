import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import meetingABI from '../contracts/deployed_nft_info/meetingABI.json';

async function main() {
    try {
        // Create public client
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http(`https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.COINBASE_API_KEY}`),
        });

        const contractAddress = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';

        console.log('\n🔍 Checking Contract:', contractAddress);

        // Check if contract exists and has basic functions
        try {
            const name = await client.readContract({
                address: contractAddress,
                abi: meetingABI,
                functionName: 'name',
            });
            console.log('Contract Name:', name);
        } catch (error) {
            console.error('Error reading name:', error);
        }

        try {
            const creator = await client.readContract({
                address: contractAddress,
                abi: meetingABI,
                functionName: 'creator',
            });
            console.log('Creator:', creator);
        } catch (error) {
            console.error('Error reading creator:', error);
        }

        try {
            const metadataURL = await client.readContract({
                address: contractAddress,
                abi: meetingABI,
                functionName: 'metadataURL',
            });
            console.log('Metadata URL:', metadataURL);
        } catch (error) {
            console.error('Error reading metadataURL:', error);
        }

    } catch (error) {
        console.error('❌ Contract check failed:', error);
        process.exit(1);
    }
}

// Run the check
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 