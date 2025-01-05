const express = require('express');
const router = express.Router();
const { PinataSDK } = require('pinata-web3');
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Initialize Pinata SDK
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL
});

// Initialize ethers contract and provider
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractABI = require('./contracts/Poap.json').abi;
const poapContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI,
    wallet
);

// Endpoint to create a new session with image
router.post('/create-session', upload.single('image'), async (req, res) => {
    try {
        const { sessionName, sessionId, description } = req.body;
        const imageFile = req.file;

        if (!imageFile || !sessionName || !sessionId) {
            return res.status(400).json({
                error: 'Missing required fields: image, sessionName, or sessionId'
            });
        }

        // 1. Upload image to IPFS
        const imageBlob = new Blob([fs.readFileSync(imageFile.path)]);
        const file = new File(
            [imageBlob],
            `PODX_Session_${sessionId}_Image${imageFile.originalname.substring(imageFile.originalname.lastIndexOf('.'))}`,
            { type: imageFile.mimetype }
        );

        const imageUpload = await pinata.upload.file(file);

        // Clean up uploaded file
        fs.unlinkSync(imageFile.path);

        // 2. Create and upload metadata JSON
        const metadata = {
            name: "PODX",
            description: description || "This is a POAP NFT from PODX.",
            image: `ipfs://${imageUpload.IpfsHash}`,
            attributes: [
                {
                    trait_type: "Session Name",
                    value: sessionName
                },
                {
                    trait_type: "Session ID",
                    value: sessionId
                }
            ]
        };

        // Upload metadata as JSON
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const metadataFile = new File(
            [metadataBlob],
            `PODX_Session_${sessionId}_Metadata.json`,
            { type: 'application/json' }
        );

        const metadataUpload = await pinata.upload.file(metadataFile);
        const metadataUri = `ipfs://${metadataUpload.IpfsHash}`;

        // 3. Create session in smart contract
        try {
            const tx = await poapContract.createSession(
                sessionName,
                metadataUri,
                sessionId
            );

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            // 4. Return success response with transaction details
            res.json({
                success: true,
                sessionId: sessionId,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber
            });

        } catch (contractError) {
            console.error('Smart contract error:', contractError);
            res.status(500).json({
                error: 'Failed to create session in smart contract',
                details: contractError.message
            });
        }

    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            error: 'Failed to create session',
            details: error.message
        });
    }
});

// Endpoint for batch minting tokens
router.post('/batch-mint', async (req, res) => {
    try {
        const { recipients, sessionId } = req.body;

        if (!recipients || !recipients.length || !sessionId) {
            return res.status(400).json({
                error: 'Missing required fields: recipients or sessionId'
            });
        }

        // Validate addresses
        const validAddresses = recipients.every(addr => ethers.utils.isAddress(addr));
        if (!validAddresses) {
            return res.status(400).json({
                error: 'Invalid Ethereum address in recipients list'
            });
        }

        // Call batch mint function
        const tx = await poapContract.batchMintTokens(recipients, sessionId);
        const receipt = await tx.wait();

        res.json({
            success: true,
            sessionId: sessionId,
            recipientCount: recipients.length,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error batch minting tokens:', error);
        res.status(500).json({
            error: 'Failed to batch mint tokens',
            details: error.message
        });
    }
});

module.exports = router;