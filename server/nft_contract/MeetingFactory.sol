// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Meeting.sol";
import "./interfaces/IMeeting.sol";

contract MeetingFactory {
    address[] public allMeetings;
    
    event MeetingCreated(
        address indexed meetingAddress,
        string sessionName,
        address creator,
        string metadataURL
    );

    // Modified to accept minters array
    function createMeeting(
        string memory sessionName,
        string memory metadataURL,
        address creator,
        address[] memory minters // New parameter
    ) public returns (address) {
        Meeting newMeeting = new Meeting(
            sessionName,
            creator,
            metadataURL,
            minters // Pass minters to constructor
        );
        
        allMeetings.push(address(newMeeting));
        
        emit MeetingCreated(
            address(newMeeting),
            sessionName,
            creator,
            metadataURL
        );
        
        return address(newMeeting);
    }

    // Rest of the contract remains the same...
    // [Keep all other functions unchanged]
}