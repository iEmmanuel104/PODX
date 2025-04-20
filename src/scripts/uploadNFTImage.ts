import { config } from 'dotenv';
import { PinataService } from '../utils/pinata';
import fs from 'fs';
import path from 'path';

// Load environment variables first
config();

async function uploadImage(imagePath: string) {
    try {
        console.log('🚀 Starting NFT image upload...\n');
        console.log('Reading image from:', imagePath);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            console.error('❌ Error: File does not exist at path:', imagePath);
            process.exit(1);
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const imageFile = new Blob([imageBuffer], { 
            type: imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 
                imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 
                    'application/octet-stream',
        });

        // Get file name without extension for NFT name
        const fileName = path.basename(imagePath, path.extname(imagePath));

        // Create NFT metadata
        const nftData = {
            image: imageFile,
            name: `${fileName} NFT`,
            description: 'NFT created via PinataService',
            attributes: [
                {
                    trait_type: 'Type',
                    value: 'Meeting',
                },
                {
                    trait_type: 'Created',
                    value: new Date().toISOString().split('T')[0], // Today's date
                },
            ],
        };

        console.log('\n📤 Uploading to IPFS...');
        const result = await PinataService.createNFTMetadata(nftData);

        console.log('\n✨ Upload Successful!\n');
        console.log('Image Preview URL:', result.imageUrl);
        console.log('NFT Metadata URL:', result.metadataUrl);
        console.log('\nComplete Metadata:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n✅ You can now use this metadata URL for minting your NFT:', result.metadataUrl);
        console.log('🖼  Preview your image at:', result.imageUrl);

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Get image path from command line argument
const imagePath = process.argv[2];

if (!imagePath) {
    console.error('Please provide an image path. Usage:');
    console.error('npx ts-node src/scripts/uploadNFTImage.ts path/to/your/image.png');
    process.exit(1);
}

uploadImage(imagePath).catch(console.error); 