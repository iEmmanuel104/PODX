POAP.sol
CA: CA: 0xf2bb496b045df0f787Ecd8A84c6890b6d2a3CFa7
1. Core Features:
- It creates non-transferable ERC721 tokens (NFTs)
- Each token represents attendance or participation in a "session"
- Tokens can't be transferred between addresses (they can only be minted or burned)
- It's named "Podx" with the symbol "PODX"

2. Session Management:
- The contract owner can create sessions with:
  - A unique session ID
  - A session name
  - A token URI (which would contain the metadata/image for the NFT)
- Each session can only be created once
- The contract maintains a record of which addresses have received tokens for each session

3. Token Distribution:
- Supports batch minting to distribute tokens to multiple addresses at once
- Prevents double-minting (an address can't receive multiple tokens for the same session)
- Each token has a unique ID and associated metadata URI

4. Token Lifecycle:
- Tokens can be burned (destroyed) by:
  - The token owner themselves
  - The contract owner (through the revoke function)
- When tokens are minted or burned, appropriate events are emitted (Attest/Revoke)

5. Key Restrictions:
- Only the contract owner can:
  - Create new sessions
  - Batch mint tokens
  - Revoke tokens
- Tokens cannot be transferred between addresses (enforced by _beforeTokenTransfer)
- Each address can only receive one token per session

This contract is useful for:
- Recording attendance at events
- Issuing participation certificates
- Creating non-transferable membership badges
- Documenting completion of courses or workshops


