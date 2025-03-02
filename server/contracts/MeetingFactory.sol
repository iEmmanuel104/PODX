// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Meeting.sol";
import "./interfaces/IMeeting.sol";

contract MeetingFactory {
    address[] public allMeetings;
    
    // Track all transactions for each meeting
    struct Transaction {
        address meetingAddress;
        address from;
        address to;
        uint256 tokenId;
        uint256 timestamp;
        string transactionType; // "mint", "transfer", etc.
    }
    
    // Store transactions by meeting address
    mapping(address => Transaction[]) public meetingTransactions;
    
    // Store all transactions chronologically
    Transaction[] public allTransactions;
    
    // Track all minters across all meetings
    mapping(address => mapping(address => bool)) public isMinterForMeeting;
    
    // Events
    event MeetingCreated(
        address indexed meetingAddress,
        string sessionName,
        address creator,
        string metadataURL
    );
    
    event TransactionRecorded(
        address indexed meetingAddress,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        string transactionType
    );

    // Create meeting function with improved tracking
    function createMeeting(
        string memory sessionName,
        string memory metadataURL,
        address creator,
        address[] memory minters
    ) public returns (address) {
        Meeting newMeeting = new Meeting(
            sessionName,
            creator,
            metadataURL,
            minters
        );
        
        address meetingAddress = address(newMeeting);
        allMeetings.push(meetingAddress);
        
        // Record minters
        for (uint256 i = 0; i < minters.length; i++) {
            isMinterForMeeting[meetingAddress][minters[i]] = true;
        }
        
        emit MeetingCreated(
            meetingAddress,
            sessionName,
            creator,
            metadataURL
        );
        
        return meetingAddress;
    }
    
    // Record mint transaction (called by Meeting contract)
    function recordMint(address from, address to, uint256 tokenId) external {
        require(isMeeting(msg.sender), "Only deployed meetings can record");
        
        Transaction memory newTx = Transaction({
            meetingAddress: msg.sender,
            from: from,
            to: to,
            tokenId: tokenId,
            timestamp: block.timestamp,
            transactionType: "mint"
        });
        
        meetingTransactions[msg.sender].push(newTx);
        allTransactions.push(newTx);
        
        emit TransactionRecorded(
            msg.sender,
            from,
            to,
            tokenId,
            "mint"
        );
    }
    
    // Record transfer transaction (called by Meeting contract)
    function recordTransfer(address from, address to, uint256 tokenId) external {
        require(isMeeting(msg.sender), "Only deployed meetings can record");
        
        Transaction memory newTx = Transaction({
            meetingAddress: msg.sender,
            from: from,
            to: to,
            tokenId: tokenId,
            timestamp: block.timestamp,
            transactionType: "transfer"
        });
        
        meetingTransactions[msg.sender].push(newTx);
        allTransactions.push(newTx);
        
        emit TransactionRecorded(
            msg.sender,
            from,
            to,
            tokenId,
            "transfer"
        );
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
    
    // Get all transactions for a specific meeting
    function getMeetingTransactions(address meetingAddress) 
        external 
        view 
        returns (Transaction[] memory) 
    {
        return meetingTransactions[meetingAddress];
    }
    
    // Get all transactions (with pagination)
    function getAllTransactions(uint256 offset, uint256 limit) 
        external 
        view 
        returns (Transaction[] memory) 
    {
        uint256 total = allTransactions.length;
        uint256 count = offset >= total ? 0 : (
            (offset + limit > total) ? (total - offset) : limit
        );
        
        Transaction[] memory result = new Transaction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allTransactions[offset + i];
        }
        
        return result;
    }
    
    // Get all meetings
    function getAllMeetings() external view returns (address[] memory) {
        return allMeetings;
    }
    
    // Get meeting count
    function getMeetingCount() external view returns (uint256) {
        return allMeetings.length;
    }
    
    // Get transaction count for a meeting
    function getMeetingTransactionCount(address meetingAddress) 
        external 
        view 
        returns (uint256) 
    {
        return meetingTransactions[meetingAddress].length;
    }
    
    // Get total transaction count
    function getTotalTransactionCount() external view returns (uint256) {
        return allTransactions.length;
    }
}