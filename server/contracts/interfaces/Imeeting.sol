// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMeeting {
    function mint(address recipient, string calldata metadataURI) external returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function getNFTRecipients() external view returns (address[] memory);
    function getNFTTransfer(uint256 tokenId) external view returns (address);
    function sessionName() external view returns (string memory);
    function metadataURL() external view returns (string memory);
    function creator() external view returns (address);
    function isMinter(address account) external view returns (bool); // New function
}