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
        string code;
        address host;
        bool active;
        mapping(address => User) users;
        address[] userAddresses;
    }

    mapping(string => PodcastSession) public podcastSessions;

    event PodcastCreated(string indexed sessionCode, address indexed host);
    event PodcastEnded(string indexed sessionCode);
    event UserJoined(string indexed sessionCode, address indexed user, UserRole role);
    event UserLeft(string indexed sessionCode, address indexed user);
    event RoleChanged(string indexed sessionCode, address indexed user, UserRole newRole);
    event TipSent(string indexed sessionCode, address indexed from, address indexed to, uint256 amount);

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @dev Create a new on-chain podcast session
     * @param _sessionCode Unique identifier for the podcast session
     */
    function createPodcast(string memory _sessionCode) external {
        require(podcastSessions[_sessionCode].host == address(0), "Podcast session already exists");

        PodcastSession storage newPodcast = podcastSessions[_sessionCode];
        newPodcast.code = _sessionCode;
        newPodcast.host = msg.sender;
        newPodcast.active = true;

        newPodcast.users[msg.sender] = User(msg.sender, UserRole.Host, true);
        newPodcast.userAddresses.push(msg.sender);

        emit PodcastCreated(_sessionCode, msg.sender);
    }

    /**
     * @dev End an active podcast session
     * @param _sessionCode Identifier of the podcast to end
     */
    function endPodcast(string memory _sessionCode) external {
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
    function joinPodcast(string memory _sessionCode) external {
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
    function leavePodcast(string memory _sessionCode) external {
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
    * @dev Request and automatically become a co-host
    * @param _sessionCode Identifier of the podcast
    */
    function requestCoHost(string memory _sessionCode) external {
        PodcastSession storage podcast = podcastSessions[_sessionCode];
        require(podcast.active, "Podcast is not active");
        require(podcast.users[msg.sender].exists, "User not in podcast");
        require(podcast.users[msg.sender].role == UserRole.Member, "User is not a member");

        // Automatically upgrade the user to co-host
        podcast.users[msg.sender].role = UserRole.CoHost;

        // Emit an event to notify about the role change
        emit RoleChanged(_sessionCode, msg.sender, UserRole.CoHost);
    }

    /**
     * @dev Approve a user to become a co-host
     * @param _sessionCode Identifier of the podcast
     * @param _user Address of the user to be promoted
     */
    function approveCoHost(string memory _sessionCode, address _user) external {
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
    function sendTip(string memory _sessionCode, address _recipient, uint256 _amount) external {
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
     * @dev Get all users in a podcast
     * @param _sessionCode Identifier of the podcast
     * @return Array of user addresses in the podcast
     */
    function getPodcastUsers(string memory _sessionCode) external view returns (address[] memory) {
        return podcastSessions[_sessionCode].userAddresses;
    }

    /**
     * @dev Get user role in a podcast
     * @param _sessionCode Identifier of the podcast
     * @param _user Address of the user
     * @return User's role in the podcast
     */
    function getUserRole(string memory _sessionCode, address _user) external view returns (UserRole) {
        return podcastSessions[_sessionCode].users[_user].role;
    }
}