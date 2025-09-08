// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for thirdweb's cross-chain functionality
interface IThirdwebBridge {
    function bridge(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        address recipient,
        bytes calldata data
    ) external payable;
}

// Interface for DEX swapping (Uniswap V3 style)
interface ISwapRouter {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
    
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

contract CrossChainTippingBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant APECHAIN_ID = 33139; // ApeChain mainnet ID
    address public constant USDC_APECHAIN = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359; // USDC on ApeChain
    
    IThirdwebBridge public thirdwebBridge;
    ISwapRouter public swapRouter;
    
    // Minimum amounts for batching
    mapping(address => uint256) public minBatchAmount;
    mapping(address => uint256) public pendingTips; // streamer => pending amount
    mapping(address => mapping(address => uint256)) public pendingTokenTips; // streamer => token => amount
    
    struct PendingTip {
        address streamer;
        address businessWallet;
        address originalToken;
        uint256 originalAmount;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(uint256 => PendingTip) public pendingTipsBatch;
    uint256 public batchCounter;
    
    event TipQueued(
        uint256 indexed batchId,
        address indexed streamer,
        address indexed businessWallet,
        address originalToken,
        uint256 originalAmount
    );
    
    event TipsBridged(
        uint256[] batchIds,
        address indexed streamer,
        uint256 totalUSDCAmount,
        uint256 apeChainTxHash
    );

    constructor(
        address _thirdwebBridge,
        address _swapRouter
    ) {
        thirdwebBridge = IThirdwebBridge(_thirdwebBridge);
        swapRouter = ISwapRouter(_swapRouter);
        
        // Set default minimum batch amounts
        minBatchAmount[address(0)] = 0.01 ether; // 0.01 ETH
        minBatchAmount[USDC_APECHAIN] = 10e6; // $10 USDC
    }

    function queueTipForBridge(
        address streamer,
        address businessWallet,
        address token,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens to this contract for batching
        if (token == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        batchCounter++;
        pendingTipsBatch[batchCounter] = PendingTip({
            streamer: streamer,
            businessWallet: businessWallet,
            originalToken: token,
            originalAmount: amount,
            timestamp: block.timestamp,
            processed: false
        });
        
        pendingTokenTips[streamer][token] += amount;
        
        emit TipQueued(batchCounter, streamer, businessWallet, token, amount);
        
        // Check if we should trigger automatic bridging
        if (pendingTokenTips[streamer][token] >= minBatchAmount[token]) {
            _processBatchTips(streamer, token);
        }
    }

    function _processBatchTips(address streamer, address token) internal {
        uint256 totalAmount = pendingTokenTips[streamer][token];
        require(totalAmount > 0, "No pending tips");
        
        // Reset pending amount
        pendingTokenTips[streamer][token] = 0;
        
        uint256 usdcAmount;
        
        if (token == USDC_APECHAIN) {
            // Already USDC, no swap needed
            usdcAmount = totalAmount;
        } else {
            // Swap to USDC first
            usdcAmount = _swapToUSDC(token, totalAmount);
        }
        
        // Bridge USDC to ApeChain
        _bridgeToApeChain(streamer, usdcAmount);
    }

    function _swapToUSDC(address inputToken, uint256 inputAmount) internal returns (uint256 usdcAmount) {
        if (inputToken == address(0)) {
            // ETH to USDC swap
            ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                path: abi.encodePacked(
                    address(0), // WETH
                    uint24(3000), // 0.3% fee
                    USDC_APECHAIN
                ),
                recipient: address(this),
                deadline: block.timestamp + 300, // 5 minutes
                amountIn: inputAmount,
                amountOutMinimum: 0 // In production, calculate minimum with slippage
            });
            
            usdcAmount = swapRouter.exactInput{value: inputAmount}(params);
        } else {
            // ERC20 to USDC swap
            IERC20(inputToken).safeApprove(address(swapRouter), inputAmount);
            
            ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                path: abi.encodePacked(
                    inputToken,
                    uint24(3000), // 0.3% fee
                    USDC_APECHAIN
                ),
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: inputAmount,
                amountOutMinimum: 0
            });
            
            usdcAmount = swapRouter.exactInput(params);
        }
    }

    function _bridgeToApeChain(address streamer, uint256 usdcAmount) internal {
        // Approve USDC for bridge
        IERC20(USDC_APECHAIN).safeApprove(address(thirdwebBridge), usdcAmount);
        
        // Bridge USDC to ApeChain
        bytes memory bridgeData = abi.encode(streamer, "tip_settlement");
        
        thirdwebBridge.bridge(
            USDC_APECHAIN,
            usdcAmount,
            APECHAIN_ID,
            streamer, // Recipient on ApeChain
            bridgeData
        );
    }

    function manualBridge(address streamer, address token) external {
        require(pendingTokenTips[streamer][token] > 0, "No pending tips");
        _processBatchTips(streamer, token);
    }

    function setMinBatchAmount(address token, uint256 amount) external onlyOwner {
        minBatchAmount[token] = amount;
    }

    function updateBridgeContract(address newBridge) external onlyOwner {
        require(newBridge != address(0), "Invalid bridge address");
        thirdwebBridge = IThirdwebBridge(newBridge);
    }

    function updateSwapRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        swapRouter = ISwapRouter(newRouter);
    }

    // View functions
    function getPendingTipAmount(address streamer, address token) external view returns (uint256) {
        return pendingTokenTips[streamer][token];
    }

    function shouldBridge(address streamer, address token) external view returns (bool) {
        return pendingTokenTips[streamer][token] >= minBatchAmount[token];
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    receive() external payable {}
}