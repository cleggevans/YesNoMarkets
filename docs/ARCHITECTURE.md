# YesNoMarket Architecture

## Overview

YesNoMarket is a decentralized prediction market platform built on BNB Chain. It allows users to create markets, trade shares, and resolve outcomes.

## System Architecture

### Smart Contract Layer

**YesNoMarket.sol** - Main contract that handles:
- Market lifecycle management
- Share trading mechanics
- Liquidity provision
- Fee collection
- Access control

### Key Components

#### 1. Market Structure

Each market contains:
- Question: The prediction question
- Creator: Address that created the market
- End Time: When the market closes
- State: Open, Resolved, or Cancelled
- Shares: Total YES and NO shares
- Prices: Current YES/NO prices
- Outcome: Final result (if resolved)
- Liquidity: Total liquidity in the market

#### 2. Pricing Mechanism

Uses Automated Market Maker (AMM) with constant product formula:
- Formula: `x * y = k`
- Initial price: 50/50 (YES/NO)
- Price adjusts based on supply and demand
- Cost increases as shares become scarce

#### 3. Trading Flow

**Buying Shares:**
1. User calls `buyShares()` with market ID, side (YES/NO), and amount
2. Contract calculates cost using AMM formula
3. User pays cost (BNB or ERC20)
4. Shares are minted and assigned to user
5. Prices are updated

**Selling Shares:**
1. User calls `sellShares()` with market ID, side, and amount
2. Contract verifies user has sufficient shares
3. Contract calculates payout using AMM formula
4. Shares are burned
5. User receives payout
6. Prices are updated

#### 4. Market Resolution

1. Creator or owner calls `resolveMarket()` with outcome
2. Market state changes to Resolved
3. Users can claim winnings via `claimWinnings()`
4. Fees are deducted from winnings
5. Remaining amount is paid to winners

#### 5. Fee Structure

- **Platform Fee**: Default 2%, goes to fee recipient
- **Creator Fee**: Set by creator (max 5%), goes to market creator
- Fees are deducted when users claim winnings

### Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks
2. **Ownable**: Access control for admin functions
3. **SafeERC20**: Safe token transfers
4. **Input Validation**: All inputs are validated
5. **Time Checks**: Market end times are enforced

### Gas Optimization

- Uses `uint256` for calculations
- Minimal storage operations
- Efficient event emissions
- Batch operations where possible

## Deployment Architecture

### Network Support

- BSC Testnet (Chain ID: 97)
- BSC Mainnet (Chain ID: 56)
- Hardhat Local Network (Chain ID: 1337)

### Deployment Process

1. Compile contracts: `npm run compile`
2. Run tests: `npm test`
3. Deploy to testnet: `npm run deploy:testnet`
4. Verify contracts: Automatic via Hardhat verify plugin
5. Deploy to mainnet: `npm run deploy:mainnet`

## Integration Points

### Frontend Integration

Frontend can interact with the contract via:
- Web3.js or Ethers.js
- Contract ABI (in `artifacts/`)
- Contract address (after deployment)

### Key Functions for Frontend

- `createMarket()`: Create new markets
- `buyShares()`: Buy YES/NO shares
- `sellShares()`: Sell shares
- `getMarket()`: Get market details
- `getUserShares()`: Get user's shares
- `calculateCost()`: Preview buy cost
- `calculatePayout()`: Preview sell payout

## Future Enhancements

Potential improvements:
- Oracle integration for automatic resolution
- Multi-token support
- Advanced AMM formulas
- Governance token
- Staking mechanisms
- Market categories/tags

