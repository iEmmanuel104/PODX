Documentation for the MeetingNFT Contracts

This documentation explains the structure and functionality of three Solidity smart contracts: MeetingFactory.sol, Meeting.sol, and IMeeting.sol. These contracts collectively enable the creation, minting, and management of meeting-related NFTs, with the functionality for creating and tracking meetings through a factory pattern.

1. Contract Structure

MeetingNFT/
├── contracts/
│   ├── MeetingFactory.sol
│   ├── Meeting.sol
│   ├── interfaces/IMeeting.sol

	•	MeetingFactory.sol: The factory contract responsible for deploying new Meeting contracts and tracking all created meetings.
	•	Meeting.sol: The core contract representing each meeting, implementing ERC721 functionality (NFTs) and including logic for batch minting and managing meeting-specific metadata.
	•	IMeeting.sol: The interface defining the functions that must be implemented by the Meeting contract. It standardizes interactions with the Meeting contract for external use.

2. Deployment Process

To deploy the contracts, you should follow these steps:

Step 1: Deploy Meeting.sol

You do not deploy the Meeting.sol contract directly. Instead, the MeetingFactory.sol contract will deploy instances of Meeting.sol using the createMeeting function.

Step 2: Deploy MeetingFactory.sol
	1.	Deploy the MeetingFactory.sol contract. This contract will be responsible for deploying instances of Meeting.sol.
	2.	After deployment, the MeetingFactory.sol contract can be interacted with to create Meeting contracts.

Step 3: Create Meetings using MeetingFactory.sol
	1.	Once the MeetingFactory.sol contract is deployed, you can use its createMeeting() function to deploy new Meeting contracts.
	2.	The function createMeeting() requires the meeting’s session name and metadata URL.
	3.	The creator address is automatically set as the address that calls the createMeeting() function, but you can customize this behavior if needed (e.g., using a company wallet).

3. Contract Details & Functionality

MeetingFactory.sol

Functionality:
	•	The MeetingFactory.sol contract is a factory that deploys new Meeting.sol instances and tracks the addresses of all created meetings.

Functions:
	1.	createMeeting(string memory sessionName, string memory metadataURL)
	•	Description: This function deploys a new instance of the Meeting.sol contract. The function requires two parameters: the sessionName (name of the meeting) and metadataURL (link to the metadata for the meeting).
	•	Access: Public, anyone can call this function to create a new meeting.
	•	Returns: The address of the newly created Meeting.sol contract.
	2.	getAllMeetings()
	•	Description: This function returns the addresses of all created Meeting.sol contracts. It is useful for tracking and querying all meetings.
	•	Access: Public, anyone can call this function.
	3.	getMeetingCount()
	•	Description: This function returns the number of Meeting.sol contracts created through the factory. It is useful for monitoring how many meetings have been created.
	•	Access: Public, anyone can call this function.

Meeting.sol

Functionality:
	•	The Meeting.sol contract represents an individual meeting, where each meeting is an ERC721-compliant NFT. The contract supports batch minting of tickets for attendees and maintains the session name, metadata URL, and creator’s address.

Functions:
	1.	batchMint(address[] calldata recipients, string[] calldata metadataURIs)
	•	Description: This function mints multiple NFTs (meeting tickets) for a list of recipients. Each recipient is assigned an NFT with a metadata URI.
	•	Access: Only the owner (creator) of the Meeting.sol contract can call this function.
	•	Parameters:
	•	recipients: An array of addresses to mint the NFTs for.
	•	metadataURIs: An array of metadata URIs corresponding to each NFT.
	•	Returns: None (function is void).
	2.	tokenURI(uint256 tokenId)
	•	Description: This function retrieves the metadata URI for a specific NFT (meeting ticket) by its token ID.
	•	Access: Public, anyone can call this function.
	•	Returns: A string representing the metadata URI for the specified token ID.
	3.	getNFTRecipients()
	•	Description: This function returns a list of all recipients (addresses) who have received NFTs (meeting tickets).
	•	Access: Public, anyone can call this function.
	•	Returns: An array of addresses who received NFTs.
	4.	getNFTTransfer(uint256 tokenId)
	•	Description: This function returns the address of the original recipient (creator) of the specified NFT.
	•	Access: Public, anyone can call this function.
	•	Returns: The address of the original recipient of the NFT.
	5.	sessionName()
	•	Description: This function returns the name of the session (meeting) associated with the contract.
	•	Access: Public, anyone can call this function.
	•	Returns: A string representing the session name.
	6.	metadataURL()
	•	Description: This function returns the metadata URL associated with the meeting.
	•	Access: Public, anyone can call this function.
	•	Returns: A string representing the metadata URL.
	7.	creator()
	•	Description: This function returns the address of the creator of the meeting (the person who deployed the contract).
	•	Access: Public, anyone can call this function.
	•	Returns: The address of the creator.

4. IMeeting.sol (Interface)

The IMeeting.sol interface defines the standardized functions that a contract implementing it must have. This ensures consistency and interoperability between different systems interacting with the Meeting.sol contract.

Functions:
	1.	batchMint(address[] calldata recipients, string[] calldata metadataURIs)
	•	Description: Standard function to mint multiple NFTs for meeting attendees.
	•	Access: Only callable by the contract owner.
	•	Parameters:
	•	recipients: An array of addresses to mint NFTs for.
	•	metadataURIs: An array of metadata URIs for the NFTs.
	2.	tokenURI(uint256 tokenId)
	•	Description: Standard function to retrieve the metadata URI for a specific NFT.
	•	Returns: A string containing the metadata URI.
	3.	getNFTRecipients()
	•	Description: Standard function to retrieve all the recipients of the meeting NFTs.
	•	Returns: An array of addresses.
	4.	getNFTTransfer(uint256 tokenId)
	•	Description: Standard function to retrieve the original recipient of a given NFT (meeting ticket).
	•	Returns: The address of the original recipient.
	5.	sessionName()
	•	Description: Standard function to retrieve the session name (meeting name).
	•	Returns: A string representing the session name.
	6.	metadataURL()
	•	Description: Standard function to retrieve the metadata URL associated with the meeting.
	•	Returns: A string representing the metadata URL.
	7.	creator()
	•	Description: Standard function to retrieve the address of the creator (meeting organizer).
	•	Returns: The address of the creator.

5. Example of Deployment and Interaction Flow
	1.	Deploy the Factory Contract:
	•	Deploy MeetingFactory.sol using your preferred Ethereum tool (Remix, Hardhat, Truffle, etc.).
	2.	Create a New Meeting:
	•	Once the factory is deployed, anyone can call the createMeeting() function to deploy a new Meeting.sol contract. For example, createMeeting("Session A", "https://metadata.url").
	3.	Mint NFTs:
	•	After deploying a Meeting.sol contract, the owner (creator) of the meeting can call batchMint() to mint NFTs for the meeting attendees.
	4.	Track NFTs:
	•	Use functions like tokenURI() to view individual NFT metadata and getNFTRecipients() to see who owns tickets for the meeting.

Conclusion

This documentation outlines the structure and functionality of the MeetingNFT ecosystem. The factory pattern provides an easy way to create and manage meetings, and the use of ERC721 NFTs ensures that each meeting ticket is unique and trackable. The MeetingFactory.sol allows anyone to create a meeting, while the Meeting.sol contract manages the specifics of each meeting, including minting tickets and tracking recipients.