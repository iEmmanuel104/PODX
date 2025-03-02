// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts@4.9.3/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.9.3/access/Ownable.sol";
import "./interfaces/IMeeting.sol";

contract Meeting is ERC721, Ownable, IMeeting {
    string public override sessionName;
    string public override metadataURL;
    address public immutable override creator;
    
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _originalRecipients;
    address[] private _allRecipients;
    mapping(address => bool) public override isMinter; // New mapping

    constructor(
        string memory _sessionName,
        address _realCreator,
        string memory _metadataURL,
        address[] memory minters // New parameter
    ) ERC721("MeetingNFT", "MNFT") {
        sessionName = _sessionName;
        metadataURL = _metadataURL;
        creator = _realCreator;
        _transferOwnership(_realCreator);

        // Set initial minters
        for (uint256 i = 0; i < minters.length; i++) {
            isMinter[minters[i]] = true;
        }
    }

    // Modified mint function with minter check
    function mint(
        address recipient,
        string calldata metadataURI
    ) external override returns (uint256) {
        require(isMinter[msg.sender], "Caller is not authorized to mint");
        uint256 tokenId = _tokenIdCounter++;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _originalRecipients[tokenId] = recipient;
        _allRecipients.push(recipient);
        return tokenId;
    }


    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, IMeeting) 
        returns (string memory) 
    {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function getNFTRecipients() external view override returns (address[] memory) {
        return _allRecipients;
    }

    function getNFTTransfer(uint256 tokenId) external view override returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _originalRecipients[tokenId];
    }

    function _exists(uint256 tokenId) internal view override(ERC721) returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}