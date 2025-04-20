import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import meetingFactoryABI from '../contracts/deployed_nft_info/MeetingFactoryABI.json';

async function main() {
    try {
        // Create public client
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http(`https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.COINBASE_API_KEY}`),
        });

        const factoryAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138';

        console.log('\n🏭 Checking Factory Contract:', factoryAddress);

        // Get all meetings
        try {
            const meetings = await client.readContract({
                address: factoryAddress,
                abi: meetingFactoryABI,
                functionName: 'getAllMeetings',
            });
            console.log('\nDeployed Meetings:', meetings);
        } catch (error) {
            console.error('Error reading meetings:', error);
        }

        // Get all transactions
        try {
            const transactions = await client.readContract({
                address: factoryAddress,
                abi: meetingFactoryABI,
                functionName: 'getAllTransactions',
                args: [0n, 10n], // Get first 10 transactions
            });
            console.log('\nRecent Transactions:', transactions);
        } catch (error) {
            console.error('Error reading transactions:', error);
        }

    } catch (error) {
        console.error('❌ Factory check failed:', error);
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