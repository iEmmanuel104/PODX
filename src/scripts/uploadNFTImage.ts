/* eslint-disable prettier/prettier */
import { config } from "dotenv";
import { PinataService } from "../utils/pinata";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Load environment variables first
config();

async function uploadImage(imagePath: string): Promise<void> {
    try {
        logger.info("🚀 Starting NFT image upload...\n");
        logger.info("Reading image from:", imagePath);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            logger.error("❌ Error: File does not exist at path:", imagePath);
            process.exit(1);
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const imageFile = new Blob([imageBuffer], {
            type: imagePath.toLowerCase().endsWith(".png")
                ? "image/png"
                : imagePath.toLowerCase().endsWith(".jpg") ||
                    imagePath.toLowerCase().endsWith(".jpeg")
                    ? "image/jpeg"
                    : "application/octet-stream",
        });

        // Get file name without extension for NFT name
        const fileName = path.basename(imagePath, path.extname(imagePath));

        // Create NFT metadata
        const nftData = {
            image: imageFile,
            name: `${fileName} NFT`,
            description: "NFT created via PinataService",
            attributes: [
                {
                    trait_type: "Type",
                    value: "Meeting",
                },
                {
                    trait_type: "Created",
                    value: new Date().toISOString().split("T")[0], // Today's date
                },
            ],
        };

        logger.info("\n📤 Uploading to IPFS...");
        const result = await PinataService.createNFTMetadata(nftData);

        logger.info("\n✨ Upload Successful!\n");
        logger.info("Image Preview URL:", result.imageUrl);
        logger.info("NFT Metadata URL:", result.metadataUrl);
        logger.info("\nComplete Metadata:");
        logger.info(JSON.stringify(result, null, 2));

        logger.info(
            "\n✅ You can now use this metadata URL for minting your NFT:",
            result.metadataUrl,
        );
        logger.info("🖼  Preview your image at:", result.imageUrl);
    } catch (error) {
        logger.error("\n❌ Error:", error);
        process.exit(1);
    }
}

// Get image path from command line argument
const imagePath = process.argv[2];

if (!imagePath) {
    logger.error("Please provide an image path. Usage:");
    logger.error(
        "npx ts-node src/scripts/uploadNFTImage.ts path/to/your/image.png",
    );
    process.exit(1);
}

uploadImage(imagePath)
    .then(() => {
        logger.info("Script execution completed.");
        process.exit(0);
    })
    .catch((error) => {
        logger.error("Unhandled error:", error);
        process.exit(1);
    });
