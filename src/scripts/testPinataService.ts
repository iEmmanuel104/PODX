import { config } from 'dotenv';
import { PinataService } from '../utils/pinata';
import fs from 'fs';
import path from 'path';

// Load environment variables first
config();

// Verify required environment variables
if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET || !process.env.PINATA_GATEWAY) {
    console.error('Missing required environment variables:');
    console.error('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✅' : '❌');
    console.error('PINATA_SECRET:', process.env.PINATA_SECRET ? '✅' : '❌');
    console.error('PINATA_GATEWAY:', process.env.PINATA_GATEWAY ? '✅' : '❌');
    process.exit(1);
}

async function main() {
    try {
        console.log('🚀 Starting Pinata Service test...\n');

        // Read a real image file for testing
        // You can replace this path with any image you want to test with
        const imagePath = path.join(__dirname, '../../assets/test-image.png');
        
        if (!fs.existsSync(imagePath)) {
            // If the test image doesn't exist, create a simple one
            const sampleImagePath = path.join(__dirname, 'test-image.txt');
            fs.writeFileSync(sampleImagePath, 'This is a test image content');
            console.log('Created a sample text file since no test image was found.');
        }
        
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const imageFile = new Blob([imageBuffer], { 
            type: imagePath.endsWith('.png') ? 'image/png' : 
                  imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'image/jpeg' : 
                  'application/octet-stream'
        });

        // Test data for NFT creation
        const nftData = {
            image: imageFile,
            name: "Test Meeting NFT",
            description: "This is a test NFT created via PinataService",
            attributes: [
                {
                    trait_type: "Type",
                    value: "Meeting"
                },
                {
                    trait_type: "Duration",
                    value: 60
                },
                {
                    trait_type: "Status",
                    value: "Test"
                }
            ]
        };

        console.log('📤 Uploading NFT data to IPFS...');
        const result = await PinataService.createNFTMetadata(nftData);

        console.log('\n✨ Upload Successful!');
        console.log('\nImage Details:');
        console.log('Preview URL:', result.imageUrl);
        console.log('IPFS URL:', result.image);

        console.log('\nMetadata Details:');
        console.log('Metadata URL (for NFT):', result.metadataUrl);
        console.log('\nComplete Metadata:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n✅ Test completed successfully!');
        console.log('\nYou can view your image at:', result.imageUrl);
        console.log('You can use this metadata URL for your NFT:', result.metadataUrl);

    } catch (error) {
        console.error('\n❌ Error in test script:', error);
        process.exit(1);
    }
}

main().catch(console.error); 