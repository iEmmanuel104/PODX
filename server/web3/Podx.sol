// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PodX
 * @dev Manages on-chain podcast sessions with hosts, co-hosts, and audience members
 */
contract PodX is Ownable {
    IERC20 public usdcToken;

    enum UserRole { Member, CoHost, Host }

    struct User {
        address wallet;
        UserRole role;
        bool exists;
    }

    struct PodcastSession {
        bytes32 code;
        address host;
        bool active;
        string ipfsContentHash; // IPFS hash for podcast content
        mapping(address => User) users;
        address[] userAddresses;
    }

    mapping(bytes32 => PodcastSession) public podcastSessions;

    event PodcastCreated(bytes32 indexed sessionCode, address indexed host, string ipfsContentHash);
    event PodcastEnded(bytes32 indexed sessionCode);
    event UserJoined(bytes32 indexed sessionCode, address indexed user, UserRole role);
    event UserLeft(bytes32 indexed sessionCode, address indexed user);
    event RoleChanged(bytes32 indexed sessionCode, address indexed user, UserRole newRole);
    event TipSent(bytes32 indexed sessionCode, address indexed from, address indexed to, uint256 amount);
    event ContentUpdated(bytes32 indexed sessionCode, string newIpfsContentHash);

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @dev Create a new on-chain podcast session
     * @param _sessionCode Unique identifier for the podcast session
     * @param _ipfsContentHash IPFS hash of the initial podcast content
     */
    function createPodcast(bytes32 _sessionCode, string memory _ipfsContentHash) external {
        require(podcastSessions[_sessionCode].host == address(0), "Podcast session already exists");

        PodcastSession storage newPodcast = podcastSessions[_sessionCode];
        newPodcast.code = _sessionCode;
        newPodcast.host = msg.sender;
        newPodcast.active = true;
        newPodcast.ipfsContentHash = _ipfsContentHash;

        newPodcast.users[msg.sender] = User(msg.sender, UserRole.Host, true);
        newPodcast.userAddresses.push(msg.sender);

        emit PodcastCreated(_sessionCode, msg.sender, _ipfsContentHash);
    }

    /**
     * @dev End an active podcast session
     * @param _sessionCode Identifier of the podcast to end
     */
    function endPodcast(bytes32 _sessionCode) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.host == msg.sender, "Only host can end podcast");

        podcast.active = false;
        emit PodcastEnded(_sessionCode);
    }

    /**
     * @dev Join an active podcast session
     * @param _sessionCode Identifier of the podcast to join
     */
    function joinPodcast(bytes32 _sessionCode) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(!podcast.users[msg.sender].exists, "User already in podcast");

        podcast.users[msg.sender] = User(msg.sender, UserRole.Member, true);
        podcast.userAddresses.push(msg.sender);

        emit UserJoined(_sessionCode, msg.sender, UserRole.Member);
    }

    /**
     * @dev Leave a podcast session
     * @param _sessionCode Identifier of the podcast to leave
     */
    function leavePodcast(bytes32 _sessionCode) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.users[msg.sender].exists, "User not in podcast");
        require(podcast.users[msg.sender].role != UserRole.Host, "Host cannot leave podcast");

        delete podcast.users[msg.sender];
        for (uint i = 0; i < podcast.userAddresses.length; i++) {
            if (podcast.userAddresses[i] == msg.sender) {
                podcast.userAddresses[i] = podcast.userAddresses[podcast.userAddresses.length - 1];
                podcast.userAddresses.pop();
                break;
            }
        }

        emit UserLeft(_sessionCode, msg.sender);
    }

    /**
     * @dev Request to become a co-host
     * @param _sessionCode Identifier of the podcast
     */
    function requestCoHost(bytes32 _sessionCode) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.users[msg.sender].exists, "User not in podcast");
        require(podcast.users[msg.sender].role == UserRole.Member, "User is not a member");

        // This function only requests co-host status. The host needs to approve it.
        // Implementation of approval process is left to the frontend or a separate function.
    }

    /**
     * @dev Approve a user to become a co-host
     * @param _sessionCode Identifier of the podcast
     * @param _user Address of the user to be promoted
     */
    function approveCoHost(bytes32 _sessionCode, address _user) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.host == msg.sender, "Only host can approve co-hosts");
        require(podcast.users[_user].exists, "User not in podcast");
        require(podcast.users[_user].role == UserRole.Member, "User is not a member");

        podcast.users[_user].role = UserRole.CoHost;
        emit RoleChanged(_sessionCode, _user, UserRole.CoHost);
    }

    /**
     * @dev Send a tip to a host or co-host
     * @param _sessionCode Identifier of the podcast
     * @param _recipient Address of the tip recipient
     * @param _amount Amount of USDC to tip
     */
    function sendTip(bytes32 _sessionCode, address _recipient, uint256 _amount) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.users[msg.sender].exists, "Sender not in podcast");
        require(podcast.users[_recipient].exists, "Recipient not in podcast");
        require(
            podcast.users[_recipient].role == UserRole.Host || 
            podcast.users[_recipient].role == UserRole.CoHost,
            "Recipient must be host or co-host"
        );

        require(usdcToken.transferFrom(msg.sender, _recipient, _amount), "USDC transfer failed");
        emit TipSent(_sessionCode, msg.sender, _recipient, _amount);
    }

    /**
     * @dev Update the podcast content
     * @param _sessionCode Identifier of the podcast
     * @param _newIpfsContentHash New IPFS hash of the updated content
     */
    function updatePodcastContent(bytes32 _sessionCode, string memory _newIpfsContentHash) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.host == msg.sender, "Only host can update content");

        podcast.ipfsContentHash = _newIpfsContentHash;
        emit ContentUpdated(_sessionCode, _newIpfsContentHash);
    }

    /**
     * @dev Get all users in a podcast
     * @param _sessionCode Identifier of the podcast
     * @return Array of user addresses in the podcast
     */
    function getPodcastUsers(bytes32 _sessionCode) external view returns (address[] memory) {
        return podcastSessions[_sessionCode].userAddresses;
    }

    /**
     * @dev Get user role in a podcast
     * @param _sessionCode Identifier of the podcast
     * @param _user Address of the user
     * @return User's role in the podcast
     */
    function getUserRole(bytes32 _sessionCode, address _user) external view returns (UserRole) {
        return podcastSessions[_sessionCode].users[_user].role;
    }

    /**
     * @dev Get podcast content hash
     * @param _sessionCode Identifier of the podcast
     * @return IPFS content hash of the podcast
     */
    function getPodcastContent(bytes32 _sessionCode) external view returns (string memory) {
        return podcastSessions[_sessionCode].ipfsContentHash;
    }
}