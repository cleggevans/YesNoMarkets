# Contracts

This directory contains the Solidity smart contracts for YesNoMarket.

## Contract Files

### YesNoMarket.sol
The main contract that implements the prediction market functionality.

**Key Features:**
- Market creation and management
- Share trading (buy/sell)
- Market resolution
- Liquidity provision
- Fee collection

**Security:**
- Uses OpenZeppelin's ReentrancyGuard
- Ownable for access control
- SafeERC20 for token transfers

### interfaces/IYesNoMarket.sol
Interface definition for the YesNoMarket contract. Useful for:
- Type safety in frontend integration
- Contract interaction patterns
- Documentation

## Compilation

Contracts are compiled using Hardhat:

```bash
npm run compile
```

Compiled artifacts are stored in `artifacts/` directory.

## Testing

Run tests with:

```bash
npm test
```

## Deployment

Deploy to BSC Testnet:
```bash
npm run deploy:testnet
```

Deploy to BSC Mainnet:
```bash
npm run deploy:mainnet
```

## Gas Estimates

Approximate gas costs (may vary):
- `createMarket()`: ~200,000 gas
- `buyShares()`: ~150,000 gas
- `sellShares()`: ~120,000 gas
- `resolveMarket()`: ~50,000 gas
- `claimWinnings()`: ~100,000 gas

## Security Audit

⚠️ **Important**: This codebase has not yet undergone a formal security audit. For production use, we recommend:
- Professional security audit
- Bug bounty program
- Insurance coverage

