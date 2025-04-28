/* eslint-disable indent */
import { config } from "dotenv";
import { PinataService } from "../utils/pinata";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Load environment variables first
config();

// Verify required environment variables
if (
    !process.env.PINATA_API_KEY ||
    !process.env.PINATA_SECRET ||
    !process.env.PINATA_GATEWAY
) {
    logger.error("Missing required environment variables:");
    logger.error("PINATA_API_KEY:", process.env.PINATA_API_KEY ? "✅" : "❌");
    logger.error("PINATA_SECRET:", process.env.PINATA_SECRET ? "✅" : "❌");
    logger.error("PINATA_GATEWAY:", process.env.PINATA_GATEWAY ? "✅" : "❌");
    process.exit(1);
}

async function main(): Promise<void> {
    try {
        logger.info("🚀 Starting Pinata Service test...\n");

        // Read a real image file for testing
        // You can replace this path with any image you want to test with
        const imagePath = path.join(__dirname, "../../assets/test-image.png");

        if (!fs.existsSync(imagePath)) {
            // If the test image doesn't exist, create a simple one
            const sampleImagePath = path.join(__dirname, "test-image.txt");
            fs.writeFileSync(sampleImagePath, "This is a test image content");
            logger.info(
                "Created a sample text file since no test image was found.",
            );
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const imageFile = new Blob([imageBuffer], {
            type: imagePath.endsWith(".png")
                ? "image/png"
                : imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")
                  ? "image/jpeg"
                  : "application/octet-stream",
        });

        // Test data for NFT creation
        const nftData = {
            image: imageFile,
            name: "Test Meeting NFT",
            description: "This is a test NFT created via PinataService",
            attributes: [
                {
                    trait_type: "Type",
                    value: "Meeting",
                },
                {
                    trait_type: "Duration",
                    value: 60,
                },
                {
                    trait_type: "Status",
                    value: "Test",
                },
            ],
        };

        logger.info("📤 Uploading NFT data to IPFS...");
        const result = await PinataService.createNFTMetadata(nftData);

        logger.info("\n✨ Upload Successful!");
        logger.info("\nImage Details:");
        logger.info("Preview URL:", result.imageUrl);
        logger.info("IPFS URL:", result.image);

        logger.info("\nMetadata Details:");
        logger.info("Metadata URL (for NFT):", result.metadataUrl);
        logger.info("\nComplete Metadata:");
        logger.info(JSON.stringify(result, null, 2));

        logger.info("\n✅ Test completed successfully!");
        logger.info("\nYou can view your image at:", result.imageUrl);
        logger.info(
            "You can use this metadata URL for your NFT:",
            result.metadataUrl,
        );
    } catch (error) {
        logger.error("\n❌ Error in test script:", error);
        process.exit(1);
    }
}

void main().catch(logger.error);
