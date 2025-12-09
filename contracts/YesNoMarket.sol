// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YesNoMarket
 * @dev A decentralized prediction market platform on BNB Chain
 * @notice Users can create markets, buy/sell shares, and resolve markets
 */
contract YesNoMarket is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Market states
    enum MarketState {
        Open,      // Market is open for trading
        Resolved,  // Market has been resolved
        Cancelled  // Market has been cancelled
    }

    // Market structure
    struct Market {
        address creator;           // Address that created the market
        string question;           // The prediction question
        uint256 endTime;           // Timestamp when market closes
        MarketState state;         // Current state of the market
        uint256 totalYesShares;   // Total YES shares issued
        uint256 totalNoShares;     // Total NO shares issued
        uint256 yesPrice;          // Current price of YES (in basis points, 10000 = 100%)
        uint256 noPrice;           // Current price of NO (in basis points, 10000 = 100%)
        bool outcome;              // true = YES won, false = NO won
        uint256 totalLiquidity;     // Total liquidity in the market
        uint256 creatorFee;        // Fee percentage for creator (basis points)
    }

    // User share balances
    struct UserShares {
        uint256 yesShares;
        uint256 noShares;
    }

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint256 endTime
    );

    event SharesBought(
        uint256 indexed marketId,
        address indexed buyer,
        bool side,  // true = YES, false = NO
        uint256 shares,
        uint256 cost
    );

    event SharesSold(
        uint256 indexed marketId,
        address indexed seller,
        bool side,
        uint256 shares,
        uint256 payout
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool outcome
    );

    event MarketCancelled(uint256 indexed marketId);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 amount);

    // State variables
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => UserShares)) public userShares;
    mapping(uint256 => mapping(address => uint256)) public liquidityProvided;
    
    uint256 public marketCount;
    uint256 public platformFee; // Platform fee in basis points (default 2%)
    address public feeRecipient; // Address to receive platform fees
    
    IERC20 public paymentToken; // ERC20 token for payments (address(0) = native BNB)

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_END_TIME_OFFSET = 1 days;
    uint256 public constant MAX_CREATOR_FEE = 500; // 5% max

    constructor(address _paymentToken, address _feeRecipient) {
        paymentToken = IERC20(_paymentToken);
        feeRecipient = _feeRecipient;
        platformFee = 200; // 2% default
    }

    /**
     * @dev Create a new prediction market
     * @param _question The prediction question
     * @param _endTime Timestamp when market closes
     * @param _initialLiquidity Initial liquidity to add
     * @param _creatorFee Fee percentage for creator (basis points, max 5%)
     */
    function createMarket(
        string memory _question,
        uint256 _endTime,
        uint256 _initialLiquidity,
        uint256 _creatorFee
    ) external payable nonReentrant returns (uint256) {
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_endTime > block.timestamp + MIN_END_TIME_OFFSET, "End time too soon");
        require(_creatorFee <= MAX_CREATOR_FEE, "Creator fee too high");
        require(_initialLiquidity > 0, "Initial liquidity required");

        uint256 marketId = marketCount++;
        
        markets[marketId] = Market({
            creator: msg.sender,
            question: _question,
            endTime: _endTime,
            state: MarketState.Open,
            totalYesShares: 0,
            totalNoShares: 0,
            yesPrice: 5000, // 50% initial
            noPrice: 5000,  // 50% initial
            outcome: false,
            totalLiquidity: _initialLiquidity,
            creatorFee: _creatorFee
        });

        // Transfer initial liquidity
        _transferPayment(msg.sender, address(this), _initialLiquidity);
        liquidityProvided[marketId][msg.sender] = _initialLiquidity;

        emit MarketCreated(marketId, msg.sender, _question, _endTime);
        emit LiquidityAdded(marketId, msg.sender, _initialLiquidity);

        return marketId;
    }

    /**
     * @dev Buy shares for a market
     * @param _marketId The market ID
     * @param _side true for YES, false for NO
     * @param _shares Number of shares to buy
     */
    function buyShares(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external payable nonReentrant {
        Market storage market = markets[_marketId];
        require(market.state == MarketState.Open, "Market not open");
        require(block.timestamp < market.endTime, "Market closed");
        require(_shares > 0, "Must buy at least 1 share");

        uint256 cost = calculateCost(_marketId, _side, _shares);
        require(cost > 0, "Invalid cost calculation");

        // Transfer payment
        _transferPayment(msg.sender, address(this), cost);

        // Update shares
        if (_side) {
            market.totalYesShares += _shares;
            userShares[_marketId][msg.sender].yesShares += _shares;
        } else {
            market.totalNoShares += _shares;
            userShares[_marketId][msg.sender].noShares += _shares;
        }

        // Update prices using constant product formula
        _updatePrices(_marketId);

        emit SharesBought(_marketId, msg.sender, _side, _shares, cost);
    }

    /**
     * @dev Sell shares for a market
     * @param _marketId The market ID
     * @param _side true for YES, false for NO
     * @param _shares Number of shares to sell
     */
    function sellShares(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.state == MarketState.Open, "Market not open");
        require(block.timestamp < market.endTime, "Market closed");

        UserShares storage shares = userShares[_marketId][msg.sender];
        
        if (_side) {
            require(shares.yesShares >= _shares, "Insufficient YES shares");
            shares.yesShares -= _shares;
            market.totalYesShares -= _shares;
        } else {
            require(shares.noShares >= _shares, "Insufficient NO shares");
            shares.noShares -= _shares;
            market.totalNoShares -= _shares;
        }

        uint256 payout = calculatePayout(_marketId, _side, _shares);
        
        // Update prices
        _updatePrices(_marketId);

        // Transfer payout
        _transferPayment(address(this), msg.sender, payout);

        emit SharesSold(_marketId, msg.sender, _side, _shares, payout);
    }

    /**
     * @dev Resolve a market (only creator or owner)
     * @param _marketId The market ID
     * @param _outcome true if YES won, false if NO won
     */
    function resolveMarket(uint256 _marketId, bool _outcome) external {
        Market storage market = markets[_marketId];
        require(
            msg.sender == market.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(market.state == MarketState.Open, "Market not open");
        require(block.timestamp >= market.endTime, "Market not closed yet");

        market.state = MarketState.Resolved;
        market.outcome = _outcome;

        emit MarketResolved(_marketId, _outcome);
    }

    /**
     * @dev Cancel a market (only creator or owner)
     * @param _marketId The market ID
     */
    function cancelMarket(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(
            msg.sender == market.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(market.state == MarketState.Open, "Market not open");

        market.state = MarketState.Cancelled;

        emit MarketCancelled(_marketId);
    }

    /**
     * @dev Claim winnings after market resolution
     * @param _marketId The market ID
     */
    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.state == MarketState.Resolved, "Market not resolved");

        UserShares storage shares = userShares[_marketId][msg.sender];
        uint256 winnings = 0;

        if (market.outcome) {
            // YES won
            require(shares.yesShares > 0, "No YES shares to claim");
            winnings = shares.yesShares;
            shares.yesShares = 0;
        } else {
            // NO won
            require(shares.noShares > 0, "No NO shares to claim");
            winnings = shares.noShares;
            shares.noShares = 0;
        }

        require(winnings > 0, "No winnings to claim");

        // Calculate payout (1:1 for winning shares)
        uint256 payout = winnings;
        
        // Deduct fees
        uint256 platformFeeAmount = (payout * platformFee) / BASIS_POINTS;
        uint256 creatorFeeAmount = (payout * market.creatorFee) / BASIS_POINTS;
        uint256 netPayout = payout - platformFeeAmount - creatorFeeAmount;

        // Transfer fees
        if (platformFeeAmount > 0) {
            _transferPayment(address(this), feeRecipient, platformFeeAmount);
        }
        if (creatorFeeAmount > 0) {
            _transferPayment(address(this), market.creator, creatorFeeAmount);
        }

        // Transfer winnings
        _transferPayment(address(this), msg.sender, netPayout);
    }

    /**
     * @dev Add liquidity to a market
     * @param _marketId The market ID
     * @param _amount Amount of liquidity to add
     */
    function addLiquidity(uint256 _marketId, uint256 _amount) external payable nonReentrant {
        Market storage market = markets[_marketId];
        require(market.state == MarketState.Open, "Market not open");
        require(_amount > 0, "Amount must be greater than 0");

        _transferPayment(msg.sender, address(this), _amount);
        market.totalLiquidity += _amount;
        liquidityProvided[_marketId][msg.sender] += _amount;

        emit LiquidityAdded(_marketId, msg.sender, _amount);
    }

    /**
     * @dev Remove liquidity from a market
     * @param _marketId The market ID
     * @param _amount Amount of liquidity to remove
     */
    function removeLiquidity(uint256 _marketId, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.state == MarketState.Open, "Market not open");
        require(liquidityProvided[_marketId][msg.sender] >= _amount, "Insufficient liquidity");
        require(market.totalLiquidity >= _amount, "Insufficient total liquidity");

        liquidityProvided[_marketId][msg.sender] -= _amount;
        market.totalLiquidity -= _amount;

        _transferPayment(address(this), msg.sender, _amount);

        emit LiquidityRemoved(_marketId, msg.sender, _amount);
    }

    /**
     * @dev Calculate cost to buy shares
     */
    function calculateCost(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) public view returns (uint256) {
        Market memory market = markets[_marketId];
        
        if (market.totalYesShares == 0 && market.totalNoShares == 0) {
            // Initial pricing: each share costs 1 unit
            return _shares;
        }

        // Constant product formula: x * y = k
        uint256 k = market.totalYesShares * market.totalNoShares;
        uint256 newTotal;
        
        if (_side) {
            newTotal = market.totalYesShares + _shares;
        } else {
            newTotal = market.totalNoShares + _shares;
        }

        uint256 otherTotal = _side ? market.totalNoShares : market.totalYesShares;
        uint256 newOtherTotal = k / newTotal;
        uint256 cost = otherTotal - newOtherTotal;

        return cost;
    }

    /**
     * @dev Calculate payout for selling shares
     */
    function calculatePayout(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) public view returns (uint256) {
        Market memory market = markets[_marketId];
        
        if (market.totalYesShares == 0 || market.totalNoShares == 0) {
            return 0;
        }

        // Constant product formula
        uint256 k = market.totalYesShares * market.totalNoShares;
        uint256 newTotal;
        
        if (_side) {
            require(market.totalYesShares >= _shares, "Insufficient shares");
            newTotal = market.totalYesShares - _shares;
        } else {
            require(market.totalNoShares >= _shares, "Insufficient shares");
            newTotal = market.totalNoShares - _shares;
        }

        uint256 otherTotal = _side ? market.totalNoShares : market.totalYesShares;
        uint256 newOtherTotal = k / newTotal;
        uint256 payout = newOtherTotal - otherTotal;

        return payout;
    }

    /**
     * @dev Update market prices based on current shares
     */
    function _updatePrices(uint256 _marketId) internal {
        Market storage market = markets[_marketId];
        uint256 totalShares = market.totalYesShares + market.totalNoShares;
        
        if (totalShares == 0) {
            market.yesPrice = 5000;
            market.noPrice = 5000;
        } else {
            market.yesPrice = (market.totalYesShares * BASIS_POINTS) / totalShares;
            market.noPrice = (market.totalNoShares * BASIS_POINTS) / totalShares;
        }
    }

    /**
     * @dev Transfer payment (handles both ERC20 and native BNB)
     */
    function _transferPayment(address from, address to, uint256 amount) internal {
        if (address(paymentToken) == address(0)) {
            // Native BNB
            if (from == address(this)) {
                payable(to).transfer(amount);
            } else {
                require(msg.value >= amount, "Insufficient BNB sent");
                if (msg.value > amount) {
                    payable(msg.sender).transfer(msg.value - amount);
                }
            }
        } else {
            // ERC20 token
            if (from == address(this)) {
                paymentToken.safeTransfer(to, amount);
            } else {
                paymentToken.safeTransferFrom(from, to, amount);
            }
        }
    }

    /**
     * @dev Get market details
     */
    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }

    /**
     * @dev Get user shares for a market
     */
    function getUserShares(uint256 _marketId, address _user) external view returns (UserShares memory) {
        return userShares[_marketId][_user];
    }

    /**
     * @dev Set platform fee (only owner)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }

    /**
     * @dev Set fee recipient (only owner)
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Set payment token (only owner)
     */
    function setPaymentToken(address _paymentToken) external onlyOwner {
        paymentToken = IERC20(_paymentToken);
    }

    // Allow contract to receive BNB
    receive() external payable {}
}

