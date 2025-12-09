# Deployment Guide

This guide will walk you through deploying YesNoMarket to BNB Chain.

## Prerequisites

1. **Node.js** (v16+)
2. **npm** or **yarn**
3. **BNB** for gas fees
4. **BscScan API Key** (for contract verification)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `PRIVATE_KEY`: Your wallet private key (for deployment)
- `BSCSCAN_API_KEY`: Your BscScan API key
- `PAYMENT_TOKEN_ADDRESS`: ERC20 token address (use `0x0000000000000000000000000000000000000000` for native BNB)
- `FEE_RECIPIENT_ADDRESS`: Address to receive platform fees

### 3. Get BNB for Gas

**Testnet:**
- Get testnet BNB from: https://testnet.binance.org/faucet-smart

**Mainnet:**
- Ensure you have sufficient BNB in your wallet

## Deployment Steps

### Testnet Deployment

1. **Compile Contracts**
```bash
npm run compile
```

2. **Run Tests**
```bash
npm test
```

3. **Deploy to Testnet**
```bash
npm run deploy:testnet
```

4. **Verify Deployment**
- Check BscScan Testnet: https://testnet.bscscan.com/
- Search for your contract address
- Verify contract is verified (should happen automatically)

### Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment uses real funds. Test thoroughly on testnet first!

1. **Double-check Configuration**
   - Verify all addresses are correct
   - Ensure sufficient BNB balance
   - Review contract code one more time

2. **Deploy**
```bash
npm run deploy:mainnet
```

3. **Verify Contract**
   - Contract should auto-verify via Hardhat
   - If not, manually verify on BscScan

## Post-Deployment

### 1. Verify Contract Functions

Use the interaction script or manually verify:
- Contract owner is correct
- Fee recipient is set correctly
- Payment token is configured correctly

### 2. Initialize (if needed)

No initialization required - contract is ready to use immediately.

### 3. Test Key Functions

Create a test market:
```javascript
const market = await ethers.getContractAt("YesNoMarket", CONTRACT_ADDRESS);
await market.createMarket(
  "Test question?",
  Math.floor(Date.now() / 1000) + 86400,
  ethers.parseEther("1.0"),
  100,
  { value: ethers.parseEther("1.0") }
);
```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**
   - Increase gas limit in hardhat.config.js
   - Ensure sufficient BNB balance

2. **Verification Failed**
   - Check BscScan API key
   - Ensure constructor arguments match
   - Try manual verification on BscScan

3. **Transaction Reverted**
   - Check gas price
   - Verify network configuration
   - Check contract requirements

## Security Checklist

Before mainnet deployment:

- [ ] Code reviewed
- [ ] Tests passing
- [ ] Testnet deployment successful
- [ ] Contract verified on BscScan
- [ ] Owner address is secure (multi-sig recommended)
- [ ] Fee recipient is correct
- [ ] Payment token address verified
- [ ] Gas estimates reviewed
- [ ] Emergency procedures documented

## Contract Addresses

After deployment, save your contract addresses:

**Testnet:**
- Contract: `0x...`
- Deployed: `YYYY-MM-DD`

**Mainnet:**
- Contract: `0x...`
- Deployed: `YYYY-MM-DD`

## Next Steps

1. Share contract address with frontend team
2. Update frontend configuration
3. Monitor contract activity
4. Set up monitoring/alerts
5. Document for users

## Support

For deployment issues, please open an issue on GitHub.

