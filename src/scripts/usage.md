const result = await MeetingContractUtils.deployAndMint({
    sessionName: "My Meeting",
    metadataURL: "https://example.com/metadata.json",
    creator: "0x123...", // creator address
    minters: ["0x456..."], // array of minter addresses
    recipientAddress: "0x456..." // who gets the minted token
});

if (result.success) {
    console.log('Contract:', result.meetingAddress);
    console.log('Mint tx:', result.mintTxHash);
} else {
    console.error('Failed:', result.error);
}
