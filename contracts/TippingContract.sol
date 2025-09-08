// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStreamerRegistry {
    function getStreamerInfo(address streamer) external view returns (bool isRegistered, address businessWallet);
}

contract TippingContract is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Fee structure: 5% platform, then 70% business / 30% streamer from remaining
    uint256 public constant PLATFORM_FEE = 500; // 5%
    uint256 public constant BUSINESS_SHARE = 7000; // 70% of remaining after platform fee
    uint256 public constant STREAMER_SHARE = 3000; // 30% of remaining after platform fee
    uint256 public constant BASIS_POINTS = 10000;

    address public platformWallet;
    IStreamerRegistry public streamerRegistry;
    
    struct Tip {
        address tipper;
        address streamer;
        address businessWallet;
        address token;
        uint256 amount;
        uint256 platformFee;
        uint256 businessAmount;
        uint256 streamerAmount;
        uint256 timestamp;
        string message;
    }

    mapping(uint256 => Tip) public tips;
    mapping(address => uint256) public streamerEarnings;
    mapping(address => uint256) public businessEarnings;
    mapping(address => mapping(address => uint256)) public tokenEarnings; // streamer/business => token => amount
    
    uint256 public tipCounter;
    uint256 public totalTipsProcessed;

    event TipSent(
        uint256 indexed tipId,
        address indexed tipper,
        address indexed streamer,
        address businessWallet,
        address token,
        uint256 amount,
        uint256 platformFee,
        uint256 businessAmount,
        uint256 streamerAmount,
        string message
    );

    event EarningsWithdrawn(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        string recipientType
    );

    constructor(address _platformWallet, address _streamerRegistry) {
        platformWallet = _platformWallet;
        streamerRegistry = IStreamerRegistry(_streamerRegistry);
    }

    function tip(
        address streamer,
        address token,
        uint256 amount,
        string calldata message
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        (bool isRegistered, address businessWallet) = streamerRegistry.getStreamerInfo(streamer);
        require(isRegistered, "Streamer not registered");
        require(businessWallet != address(0), "Invalid business wallet");

        uint256 actualAmount;
        
        if (token == address(0)) {
            // ETH tip
            require(msg.value == amount, "ETH amount mismatch");
            actualAmount = amount;
        } else {
            // ERC20 tip
            require(msg.value == 0, "Cannot send ETH with token tip");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            actualAmount = amount;
        }

        // Calculate fees
        uint256 platformFee = (actualAmount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 remainingAmount = actualAmount - platformFee;
        uint256 businessAmount = (remainingAmount * BUSINESS_SHARE) / BASIS_POINTS;
        uint256 streamerAmount = remainingAmount - businessAmount;

        // Store tip data
        tipCounter++;
        tips[tipCounter] = Tip({
            tipper: msg.sender,
            streamer: streamer,
            businessWallet: businessWallet,
            token: token,
            amount: actualAmount,
            platformFee: platformFee,
            businessAmount: businessAmount,
            streamerAmount: streamerAmount,
            timestamp: block.timestamp,
            message: message
        });

        // Update earnings tracking
        streamerEarnings[streamer] += streamerAmount;
        businessEarnings[businessWallet] += businessAmount;
        tokenEarnings[streamer][token] += streamerAmount;
        tokenEarnings[businessWallet][token] += businessAmount;
        totalTipsProcessed += actualAmount;

        // Transfer platform fee immediately
        if (platformFee > 0) {
            if (token == address(0)) {
                payable(platformWallet).transfer(platformFee);
            } else {
                IERC20(token).safeTransfer(platformWallet, platformFee);
            }
        }

        emit TipSent(
            tipCounter,
            msg.sender,
            streamer,
            businessWallet,
            token,
            actualAmount,
            platformFee,
            businessAmount,
            streamerAmount,
            message
        );
    }

    function withdrawStreamerEarnings(address token) external nonReentrant {
        uint256 amount = tokenEarnings[msg.sender][token];
        require(amount > 0, "No earnings to withdraw");

        tokenEarnings[msg.sender][token] = 0;
        streamerEarnings[msg.sender] -= amount;

        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit EarningsWithdrawn(msg.sender, token, amount, "streamer");
    }

    function withdrawBusinessEarnings(address token) external nonReentrant {
        uint256 amount = tokenEarnings[msg.sender][token];
        require(amount > 0, "No earnings to withdraw");

        tokenEarnings[msg.sender][token] = 0;
        businessEarnings[msg.sender] -= amount;

        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit EarningsWithdrawn(msg.sender, token, amount, "business");
    }

    function getStreamerTokenEarnings(address streamer, address token) external view returns (uint256) {
        return tokenEarnings[streamer][token];
    }

    function getBusinessTokenEarnings(address business, address token) external view returns (uint256) {
        return tokenEarnings[business][token];
    }

    function getTipDetails(uint256 tipId) external view returns (Tip memory) {
        return tips[tipId];
    }

    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        require(newPlatformWallet != address(0), "Invalid platform wallet");
        platformWallet = newPlatformWallet;
    }

    function updateStreamerRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid registry address");
        streamerRegistry = IStreamerRegistry(newRegistry);
    }

    // Emergency withdrawal function for owner
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}