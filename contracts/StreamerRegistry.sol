// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StreamerRegistry is Ownable, ReentrancyGuard {
    struct StreamerInfo {
        bool isRegistered;
        address businessWallet;
        address apeChainWallet; // Wallet for receiving USDC on ApeChain
        string username;
        string profileUrl;
        uint256 registrationTimestamp;
        bool isActive;
    }
    
    mapping(address => StreamerInfo) public streamers;
    mapping(string => address) public usernameToAddress;
    mapping(address => address[]) public businessStreamers; // business => streamers list
    
    address[] public allStreamers;
    uint256 public totalRegisteredStreamers;
    
    event StreamerRegistered(
        address indexed streamerAddress,
        address indexed businessWallet,
        address indexed apeChainWallet,
        string username
    );
    
    event StreamerUpdated(
        address indexed streamerAddress,
        address indexed newBusinessWallet,
        address indexed newApeChainWallet
    );
    
    event StreamerStatusChanged(
        address indexed streamerAddress,
        bool isActive
    );

    function registerStreamer(
        address streamerAddress,
        address businessWallet,
        address apeChainWallet,
        string calldata username,
        string calldata profileUrl
    ) external {
        require(streamerAddress != address(0), "Invalid streamer address");
        require(businessWallet != address(0), "Invalid business wallet");
        require(apeChainWallet != address(0), "Invalid ApeChain wallet");
        require(bytes(username).length > 0, "Username required");
        require(!streamers[streamerAddress].isRegistered, "Streamer already registered");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        // Only the streamer themselves or contract owner can register
        require(msg.sender == streamerAddress || msg.sender == owner(), "Unauthorized registration");
        
        streamers[streamerAddress] = StreamerInfo({
            isRegistered: true,
            businessWallet: businessWallet,
            apeChainWallet: apeChainWallet,
            username: username,
            profileUrl: profileUrl,
            registrationTimestamp: block.timestamp,
            isActive: true
        });
        
        usernameToAddress[username] = streamerAddress;
        businessStreamers[businessWallet].push(streamerAddress);
        allStreamers.push(streamerAddress);
        totalRegisteredStreamers++;
        
        emit StreamerRegistered(streamerAddress, businessWallet, apeChainWallet, username);
    }
    
    function updateStreamerInfo(
        address businessWallet,
        address apeChainWallet,
        string calldata profileUrl
    ) external {
        require(streamers[msg.sender].isRegistered, "Streamer not registered");
        require(businessWallet != address(0), "Invalid business wallet");
        require(apeChainWallet != address(0), "Invalid ApeChain wallet");
        
        StreamerInfo storage streamer = streamers[msg.sender];
        
        // Update business streamers mapping if business wallet changed
        if (streamer.businessWallet != businessWallet) {
            _removeFromBusinessStreamers(streamer.businessWallet, msg.sender);
            businessStreamers[businessWallet].push(msg.sender);
        }
        
        streamer.businessWallet = businessWallet;
        streamer.apeChainWallet = apeChainWallet;
        streamer.profileUrl = profileUrl;
        
        emit StreamerUpdated(msg.sender, businessWallet, apeChainWallet);
    }
    
    function setStreamerStatus(address streamerAddress, bool isActive) external {
        require(streamers[streamerAddress].isRegistered, "Streamer not registered");
        
        // Only streamer themselves or owner can change status
        require(msg.sender == streamerAddress || msg.sender == owner(), "Unauthorized");
        
        streamers[streamerAddress].isActive = isActive;
        
        emit StreamerStatusChanged(streamerAddress, isActive);
    }
    
    // View functions for TippingContract integration
    function getStreamerInfo(address streamerAddress) external view returns (bool isRegistered, address businessWallet) {
        StreamerInfo memory streamer = streamers[streamerAddress];
        return (streamer.isRegistered && streamer.isActive, streamer.businessWallet);
    }
    
    function getStreamerDetails(address streamerAddress) external view returns (StreamerInfo memory) {
        return streamers[streamerAddress];
    }
    
    function getStreamerByUsername(string calldata username) external view returns (address) {
        return usernameToAddress[username];
    }
    
    function getBusinessStreamers(address businessWallet) external view returns (address[] memory) {
        return businessStreamers[businessWallet];
    }
    
    function getApeChainWallet(address streamerAddress) external view returns (address) {
        require(streamers[streamerAddress].isRegistered, "Streamer not registered");
        return streamers[streamerAddress].apeChainWallet;
    }
    
    function isStreamerActive(address streamerAddress) external view returns (bool) {
        return streamers[streamerAddress].isRegistered && streamers[streamerAddress].isActive;
    }
    
    function getAllStreamers() external view returns (address[] memory) {
        return allStreamers;
    }
    
    function getActiveStreamers() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active streamers
        for (uint256 i = 0; i < allStreamers.length; i++) {
            if (streamers[allStreamers[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory activeStreamers = new address[](activeCount);
        uint256 currentIndex = 0;
        
        // Fill active streamers array
        for (uint256 i = 0; i < allStreamers.length; i++) {
            if (streamers[allStreamers[i]].isActive) {
                activeStreamers[currentIndex] = allStreamers[i];
                currentIndex++;
            }
        }
        
        return activeStreamers;
    }
    
    // Internal helper function
    function _removeFromBusinessStreamers(address businessWallet, address streamerAddress) internal {
        address[] storage streamersArray = businessStreamers[businessWallet];
        for (uint256 i = 0; i < streamersArray.length; i++) {
            if (streamersArray[i] == streamerAddress) {
                streamersArray[i] = streamersArray[streamersArray.length - 1];
                streamersArray.pop();
                break;
            }
        }
    }
    
    // Admin functions
    function adminRegisterStreamer(
        address streamerAddress,
        address businessWallet,
        address apeChainWallet,
        string calldata username,
        string calldata profileUrl
    ) external onlyOwner {
        require(streamerAddress != address(0), "Invalid streamer address");
        require(businessWallet != address(0), "Invalid business wallet");
        require(apeChainWallet != address(0), "Invalid ApeChain wallet");
        require(bytes(username).length > 0, "Username required");
        require(!streamers[streamerAddress].isRegistered, "Streamer already registered");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        streamers[streamerAddress] = StreamerInfo({
            isRegistered: true,
            businessWallet: businessWallet,
            apeChainWallet: apeChainWallet,
            username: username,
            profileUrl: profileUrl,
            registrationTimestamp: block.timestamp,
            isActive: true
        });
        
        usernameToAddress[username] = streamerAddress;
        businessStreamers[businessWallet].push(streamerAddress);
        allStreamers.push(streamerAddress);
        totalRegisteredStreamers++;
        
        emit StreamerRegistered(streamerAddress, businessWallet, apeChainWallet, username);
    }
    
    function adminDeactivateStreamer(address streamerAddress) external onlyOwner {
        require(streamers[streamerAddress].isRegistered, "Streamer not registered");
        streamers[streamerAddress].isActive = false;
        emit StreamerStatusChanged(streamerAddress, false);
    }
}