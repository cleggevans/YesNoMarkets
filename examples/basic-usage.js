/**
 * Basic Usage Examples for YesNoMarket
 * 
 * This file demonstrates how to interact with the YesNoMarket contract
 */

const { ethers } = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x...";
  
  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  
  // Attach to deployed contract
  const YesNoMarket = await ethers.getContractFactory("YesNoMarket");
  const market = YesNoMarket.attach(CONTRACT_ADDRESS);

  console.log("=== YesNoMarket Basic Usage Examples ===\n");

  // Example 1: Create a Market
  console.log("1. Creating a market...");
  const question = "Will BNB reach $1000 by end of 2024?";
  const endTime = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
  const initialLiquidity = ethers.parseEther("10.0");
  const creatorFee = 100; // 1%

  const createTx = await market.connect(user1).createMarket(
    question,
    endTime,
    initialLiquidity,
    creatorFee,
    { value: initialLiquidity }
  );
  await createTx.wait();
  console.log("✓ Market created!");
  console.log("  Transaction:", createTx.hash);

  const marketId = 0; // First market

  // Example 2: Get Market Details
  console.log("\n2. Getting market details...");
  const marketData = await market.getMarket(marketId);
  console.log("  Question:", marketData.question);
  console.log("  Creator:", marketData.creator);
  console.log("  End Time:", new Date(Number(marketData.endTime) * 1000).toLocaleString());
  console.log("  State:", marketData.state === 0 ? "Open" : marketData.state === 1 ? "Resolved" : "Cancelled");
  console.log("  YES Price:", Number(marketData.yesPrice) / 100, "%");
  console.log("  NO Price:", Number(marketData.noPrice) / 100, "%");

  // Example 3: Calculate Cost Before Buying
  console.log("\n3. Calculating cost to buy shares...");
  const sharesToBuy = ethers.parseEther("1.0");
  const yesCost = await market.calculateCost(marketId, true, sharesToBuy);
  const noCost = await market.calculateCost(marketId, false, sharesToBuy);
  console.log("  Cost to buy 1 YES share:", ethers.formatEther(yesCost), "BNB");
  console.log("  Cost to buy 1 NO share:", ethers.formatEther(noCost), "BNB");

  // Example 4: Buy YES Shares
  console.log("\n4. Buying YES shares...");
  const buyTx = await market.connect(user2).buyShares(
    marketId,
    true, // YES
    sharesToBuy,
    { value: yesCost }
  );
  await buyTx.wait();
  console.log("✓ YES shares purchased!");
  console.log("  Transaction:", buyTx.hash);

  // Example 5: Check User Shares
  console.log("\n5. Checking user shares...");
  const userShares = await market.getUserShares(marketId, user2.address);
  console.log("  User YES shares:", ethers.formatEther(userShares.yesShares));
  console.log("  User NO shares:", ethers.formatEther(userShares.noShares));

  // Example 6: Calculate Payout Before Selling
  console.log("\n6. Calculating payout for selling shares...");
  const sharesToSell = ethers.parseEther("0.5");
  const payout = await market.calculatePayout(marketId, true, sharesToSell);
  console.log("  Payout for selling 0.5 YES shares:", ethers.formatEther(payout), "BNB");

  // Example 7: Sell Shares
  console.log("\n7. Selling shares...");
  const sellTx = await market.connect(user2).sellShares(
    marketId,
    true, // YES
    sharesToSell
  );
  await sellTx.wait();
  console.log("✓ Shares sold!");
  console.log("  Transaction:", sellTx.hash);

  // Example 8: Resolve Market (Creator only)
  console.log("\n8. Resolving market...");
  // Note: This requires the market to be past its end time
  // In a real scenario, you'd need to wait or use time manipulation
  console.log("  (Skipped - requires market to be past end time)");

  // Example 9: Claim Winnings (after resolution)
  console.log("\n9. Claiming winnings...");
  console.log("  (Skipped - requires market to be resolved)");

  console.log("\n=== Examples Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

