import { config } from "dotenv";
import { MeetingContractUtils } from "../utils/meetingContractUtils";

// Load environment variables first
config();

// Verify required environment variables
if (
    !process.env.FACTORY_ADDRESS ||
    !process.env.PRIVATE_KEY ||
    !process.env.COINBASE_API_KEY
) {
    console.error("Missing required environment variables:");
    console.error(
        "FACTORY_ADDRESS:",
        process.env.FACTORY_ADDRESS ? "✅" : "❌",
    );
    console.error("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅" : "❌");
    console.error(
        "COINBASE_API_KEY:",
        process.env.COINBASE_API_KEY ? "✅" : "❌",
    );
    process.exit(1);
}

async function main() {
    try {
        // Test parameters
        const recipientAddress = "0x4C4F1968359425Eb6457Dd89E88EDA18fBC39C45";
        const sessionName = "Test Meeting";

        // Use the metadata IPFS URL
        const metadataURL =
            "ipfs://bafkreigh3r7sfkclis5v7n6ovwyvmd2eanhojwpq3uwy2idgmxlg6feky4";

        // Get the smart account address for logging
        const { account } = await MeetingContractUtils.getClients();
        const smartAccountAddress = account.address;
        console.log("\nUsing smart account address:", smartAccountAddress);

        // Deploy contract and mint token in one operation
        const result = await MeetingContractUtils.deployAndMint({
            sessionName,
            metadataURL: metadataURL,
            creator: recipientAddress,
            minters: [recipientAddress], // Smart account will be added automatically
            recipientAddress,
        });

        if (!result.success) {
            throw new Error(`Operation failed: ${result.error}`);
        }

        console.log("\n✨ Test Completed Successfully!");
        console.log("Meeting Contract:", result.meetingAddress);
        console.log("Mint Transaction:", result.mintTxHash);
    } catch (error) {
        console.error("Error in test script:", error);
        process.exit(1);
    }
}

main().catch(console.error);
