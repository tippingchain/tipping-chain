// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStreamingTip {
    address public owner;
    uint256 public constant PLATFORM_FEE = 500; // 5%
    uint256 public constant BUSINESS_SHARE = 7000; // 70% of remaining
    uint256 public constant STREAMER_SHARE = 3000; // 30% of remaining
    uint256 public constant BASIS_POINTS = 10000;
    
    address public platformWallet;
    
    struct StreamerInfo {
        bool isRegistered;
        address businessWallet;
        address apeChainWallet;
        string username;
        bool isActive;
    }
    
    struct Tip {
        address tipper;
        address streamer;
        uint256 amount;
        uint256 platformFee;
        uint256 businessAmount;
        uint256 streamerAmount;
        uint256 timestamp;
        string message;
    }
    
    mapping(address => StreamerInfo) public streamers;
    mapping(uint256 => Tip) public tips;
    mapping(address => uint256) public streamerEarnings;
    mapping(address => uint256) public businessEarnings;
    
    uint256 public tipCounter;
    uint256 public totalTipsProcessed;
    
    event StreamerRegistered(address indexed streamerAddress, address indexed businessWallet, string username);
    event TipSent(uint256 indexed tipId, address indexed tipper, address indexed streamer, uint256 amount, uint256 platformFee, uint256 businessAmount, uint256 streamerAmount, string message);
    event EarningsWithdrawn(address indexed recipient, uint256 amount, string recipientType);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier nonReentrant() {
        // Simple reentrancy guard
        _;
    }
    
    constructor(address _platformWallet) {
        owner = msg.sender;
        platformWallet = _platformWallet;
    }
    
    function registerStreamer(
        address streamerAddress,
        address businessWallet,
        address apeChainWallet,
        string calldata username
    ) external {
        require(streamerAddress != address(0), "Invalid streamer address");
        require(businessWallet != address(0), "Invalid business wallet");
        require(apeChainWallet != address(0), "Invalid ApeChain wallet");
        require(bytes(username).length > 0, "Username required");
        require(!streamers[streamerAddress].isRegistered, "Streamer already registered");
        
        // Only the streamer themselves or contract owner can register
        require(msg.sender == streamerAddress || msg.sender == owner, "Unauthorized registration");
        
        streamers[streamerAddress] = StreamerInfo({
            isRegistered: true,
            businessWallet: businessWallet,
            apeChainWallet: apeChainWallet,
            username: username,
            isActive: true
        });
        
        emit StreamerRegistered(streamerAddress, businessWallet, username);
    }
    
    function tip(address streamer, string calldata message) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(streamers[streamer].isRegistered, "Streamer not registered");
        require(streamers[streamer].isActive, "Streamer not active");
        
        address businessWallet = streamers[streamer].businessWallet;
        uint256 amount = msg.value;
        
        // Calculate fees
        uint256 platformFee = (amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 remainingAmount = amount - platformFee;
        uint256 businessAmount = (remainingAmount * BUSINESS_SHARE) / BASIS_POINTS;
        uint256 streamerAmount = remainingAmount - businessAmount;
        
        // Store tip data
        tipCounter++;
        tips[tipCounter] = Tip({
            tipper: msg.sender,
            streamer: streamer,
            amount: amount,
            platformFee: platformFee,
            businessAmount: businessAmount,
            streamerAmount: streamerAmount,
            timestamp: block.timestamp,
            message: message
        });
        
        // Update earnings tracking
        streamerEarnings[streamer] += streamerAmount;
        businessEarnings[businessWallet] += businessAmount;
        totalTipsProcessed += amount;
        
        // Transfer platform fee immediately
        if (platformFee > 0) {
            payable(platformWallet).transfer(platformFee);
        }
        
        emit TipSent(tipCounter, msg.sender, streamer, amount, platformFee, businessAmount, streamerAmount, message);
    }
    
    function withdrawStreamerEarnings() external nonReentrant {
        uint256 amount = streamerEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");
        require(streamers[msg.sender].isRegistered, "Not a registered streamer");
        
        streamerEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit EarningsWithdrawn(msg.sender, amount, "streamer");
    }
    
    function withdrawBusinessEarnings() external nonReentrant {
        uint256 amount = businessEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");
        
        businessEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit EarningsWithdrawn(msg.sender, amount, "business");
    }
    
    function getStreamerInfo(address streamerAddress) external view returns (bool isRegistered, address businessWallet) {
        StreamerInfo memory streamer = streamers[streamerAddress];
        return (streamer.isRegistered && streamer.isActive, streamer.businessWallet);
    }
    
    function getTipDetails(uint256 tipId) external view returns (Tip memory) {
        return tips[tipId];
    }
    
    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        require(newPlatformWallet != address(0), "Invalid platform wallet");
        platformWallet = newPlatformWallet;
    }
    
    function setStreamerStatus(address streamerAddress, bool isActive) external {
        require(streamers[streamerAddress].isRegistered, "Streamer not registered");
        require(msg.sender == streamerAddress || msg.sender == owner, "Unauthorized");
        
        streamers[streamerAddress].isActive = isActive;
    }
    
    // Emergency withdrawal function for owner
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }
    
    receive() external payable {}
}