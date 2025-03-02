// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Meeting.sol";
import "./interfaces/IMeeting.sol";

contract MeetingFactory {
    address[] public allMeetings;

    // Store transactions for each meeting
    mapping(address => Transaction[]) public meetingTransactions;

    // Track all transactions globally
    Transaction[] public allTransactions;

    // Event when a new meeting is created
    event MeetingCreated(address indexed meetingAddress, address creator);

    // Event when a transaction (mint or transfer) is recorded
    event TransactionRecorded(
        address indexed meetingAddress,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        string transactionType
    );

    struct Transaction {
        address from;
        address to;
        uint256 tokenId;
        uint256 timestamp;
        string transactionType;
    }

    // Create a new meeting
    function createMeeting(
        string memory sessionName,
        string memory metadataURL,
        address creator,
        address[] memory minters
    ) public returns (address) {
        Meeting newMeeting = new Meeting(sessionName, creator, metadataURL, minters);
        address meetingAddress = address(newMeeting);
        allMeetings.push(meetingAddress);

        emit MeetingCreated(meetingAddress, creator);
        return meetingAddress;
    }

    // Record a mint transaction
    function recordMint(address from, address to, uint256 tokenId) external {
        require(isMeeting(msg.sender), "Only deployed meetings can record");

        Transaction memory newTx = Transaction({
            from: from,
            to: to,
            tokenId: tokenId,
            timestamp: block.timestamp,
            transactionType: "mint"
        });

        meetingTransactions[msg.sender].push(newTx);
        allTransactions.push(newTx);

        emit TransactionRecorded(msg.sender, from, to, tokenId, "mint");
    }

    // Record a transfer transaction
    function recordTransfer(address from, address to, uint256 tokenId) external {
        require(isMeeting(msg.sender), "Only deployed meetings can record");

        Transaction memory newTx = Transaction({
            from: from,
            to: to,
            tokenId: tokenId,
            timestamp: block.timestamp,
            transactionType: "transfer"
        });

        meetingTransactions[msg.sender].push(newTx);
        allTransactions.push(newTx);

        emit TransactionRecorded(msg.sender, from, to, tokenId, "transfer");
    }

    // Check if an address is a deployed meeting
    function isMeeting(address addr) public view returns (bool) {
        for (uint256 i = 0; i < allMeetings.length; i++) {
            if (allMeetings[i] == addr) {
                return true;
            }
        }
        return false;
    }

    // Get all meetings
    function getAllMeetings() external view returns (address[] memory) {
        return allMeetings;
    }

    // Get all transactions (with pagination)
    function getAllTransactions(uint256 offset, uint256 limit)
        external
        view
        returns (Transaction[] memory)
    {
        uint256 total = allTransactions.length;
        uint256 count = offset >= total ? 0 : ((offset + limit > total) ? (total - offset) : limit);

        Transaction[] memory result = new Transaction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allTransactions[offset + i];
        }

        return result;
    }
}