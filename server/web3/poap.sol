// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@4.7.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.7.0/utils/Counters.sol";

contract Poap is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    event Attest(address indexed to, uint256 indexed tokenId);
    event Revoke(address indexed to, uint256 indexed tokenId);
    event SessionCreated(uint256 indexed sessionId, string name);
    event BatchMinted(uint256 indexed sessionId, uint256 count);

    // Session details struct
    struct SessionDetails {
        string name;
        string tokenURI;
        bool exists;
    }
    
    // Mapping to store session details
    mapping(uint256 => SessionDetails) public sessions;
    
    // Mapping to track if an address already has a token for a specific session
    mapping(uint256 => mapping(address => bool)) public hasReceivedToken;

    constructor() ERC721("Podx", "PODX") {}

    // Create a new session
    function createSession(
        string memory sessionName,
        string memory tokenURI_,
        uint256 sessionId
    ) public onlyOwner {
        require(!sessions[sessionId].exists, "Session already exists");
        
        sessions[sessionId] = SessionDetails({
            name: sessionName,
            tokenURI: tokenURI_,
            exists: true
        });
        
        emit SessionCreated(sessionId, sessionName);
    }

    // Batch mint tokens for multiple recipients
    function batchMintTokens(
        address[] calldata recipients,
        uint256 sessionId
    ) public onlyOwner {
        require(sessions[sessionId].exists, "Session does not exist");
        
        for (uint i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(!hasReceivedToken[sessionId][recipients[i]], "Recipient already has token for this session");
            
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, sessions[sessionId].tokenURI);
            
            hasReceivedToken[sessionId][recipients[i]] = true;
        }
        
        emit BatchMinted(sessionId, recipients.length);
    }

    // Original safeMint function kept for compatibility
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only owner of the token can burn it");
        _burn(tokenId);
    }

    function revoke(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256) pure override internal {
        require(from == address(0) || to == address(0), "Not allowed to transfer token");
    }

    function _afterTokenTransfer(address from, address to, uint256 tokenId) override internal {
        if (from == address(0)) {
            emit Attest(to, tokenId);
        } else if (to == address(0)) {
            emit Revoke(to, tokenId);
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Helper function to check if an address has received a token for a session
    function hasReceivedTokenForSession(uint256 sessionId, address recipient) 
        public 
        view 
        returns (bool) 
    {
        return hasReceivedToken[sessionId][recipient];
    }

    // Helper function to get session details
    function getSessionDetails(uint256 sessionId) 
        public 
        view 
        returns (string memory name, string memory tokenURI_, bool exists) 
    {
        SessionDetails memory session = sessions[sessionId];
        return (session.name, session.tokenURI, session.exists);
    }
}