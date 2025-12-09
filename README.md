# YesNoMarket

A decentralized prediction market platform built on **BNB Chain**, similar to Polymarket. Users can create markets, buy/sell shares, and resolve outcomes.

## 🌐 Built on BNB Chain

YesNoMarket is built specifically for the BNB Chain ecosystem, leveraging its low transaction fees and fast block times to provide an efficient prediction market experience.

- **Network**: BNB Chain (BSC)
- **Chain ID**: 56 (Mainnet), 97 (Testnet)
- **Native Token**: BNB
- **Gas Optimization**: Optimized for BNB Chain's gas structure

## 🚀 Features

- **Market Creation**: Create prediction markets with custom questions and end times
- **Share Trading**: Buy and sell YES/NO shares using automated market maker (AMM) pricing
- **Market Resolution**: Creators can resolve markets and determine outcomes
- **Liquidity Provision**: Add/remove liquidity to markets
- **Fee System**: Configurable platform and creator fees
- **BNB Chain Native**: Built specifically for BNB Chain ecosystem

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- BNB Chain wallet with testnet/mainnet BNB

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/yesnomarket.git
cd yesnomarket
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

4. Configure your `.env` file with:
   - `PRIVATE_KEY`: Your wallet private key (for deployment)
   - `BSCSCAN_API_KEY`: Your BscScan API key (for contract verification)
   - `PAYMENT_TOKEN_ADDRESS`: ERC20 token address (use `0x0000000000000000000000000000000000000000` for native BNB)
   - `FEE_RECIPIENT_ADDRESS`: Address to receive platform fees

## 📝 Contract Overview

### YesNoMarket.sol

The main contract that handles:
- Market creation and management
- Share trading (buy/sell)
- Market resolution
- Liquidity provision
- Fee collection

**Key Functions:**
- `createMarket()`: Create a new prediction market
- `buyShares()`: Buy YES or NO shares
- `sellShares()`: Sell YES or NO shares
- `resolveMarket()`: Resolve a market with an outcome
- `claimWinnings()`: Claim winnings after market resolution
- `addLiquidity()` / `removeLiquidity()`: Manage market liquidity

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Or run with coverage:
```bash
npx hardhat coverage
```

## 🚢 Deployment

### Deploy to BSC Testnet

```bash
npm run deploy:testnet
```

### Deploy to BSC Mainnet

```bash
npm run deploy:mainnet
```

Make sure you have:
- Sufficient BNB for gas fees
- Correct network configuration in `hardhat.config.js`
- `.env` file properly configured

## 📊 Contract Architecture

### Market States
- **Open**: Market is active and accepting trades
- **Resolved**: Market has been resolved with an outcome
- **Cancelled**: Market has been cancelled

### Pricing Mechanism
Uses a constant product formula (x * y = k) similar to Uniswap:
- Initial price: 50/50 (YES/NO)
- Price adjusts based on supply and demand
- Cost to buy shares increases as supply decreases

### Fee Structure
- **Platform Fee**: Default 2% (configurable by owner, max 10%)
- **Creator Fee**: Set by market creator (max 5%)
- Fees are deducted from winnings when users claim

## 🔐 Security

- Uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks
- Uses `Ownable` for access control
- SafeERC20 for token transfers
- Input validation on all public functions

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

For questions or support, please open an issue on GitHub.

## 🔗 Links

- [BNB Chain Documentation](https://docs.bnbchain.org/)
- [DappBay - BNB Chain DApp Discovery](https://dappbay.bnbchain.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BscScan](https://bscscan.com/)

## 📈 Project Status

- ✅ Smart contracts deployed and tested
- ✅ Testnet deployment ready
- ✅ Mainnet deployment ready
- ✅ Documentation complete
- 🔄 Frontend development (in progress)

## 🏗️ Project Structure

```
yesnomarket/
├── contracts/           # Solidity smart contracts
│   ├── YesNoMarket.sol  # Main contract
│   └── interfaces/      # Contract interfaces
├── scripts/             # Deployment and utility scripts
├── test/                # Test files
├── docs/                # Documentation
├── examples/            # Usage examples
└── hardhat.config.js    # Hardhat configuration
```

## 📊 Contract Information

- **Contract Name**: YesNoMarket
- **Solidity Version**: 0.8.20
- **License**: MIT
- **Standards**: ERC20 compatible, OpenZeppelin standards

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always audit smart contracts before deploying to mainnet.

