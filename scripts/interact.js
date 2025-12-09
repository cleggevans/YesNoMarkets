const hre = require("hardhat");

/**
 * Example script to interact with YesNoMarket contract
 * Replace CONTRACT_ADDRESS with your deployed contract address
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x...";
  
  const YesNoMarket = await hre.ethers.getContractFactory("YesNoMarket");
  const market = YesNoMarket.attach(CONTRACT_ADDRESS);

  const [owner, user1] = await hre.ethers.getSigners();

  console.log("Interacting with YesNoMarket at:", CONTRACT_ADDRESS);
  console.log("Owner address:", owner.address);

  // Example: Create a market
  const question = "Will BNB reach $1000 by end of 2024?";
  const endTime = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now
  const initialLiquidity = hre.ethers.parseEther("10.0");
  const creatorFee = 100; // 1%

  console.log("\nCreating market...");
  const tx = await market.connect(user1).createMarket(
    question,
    endTime,
    initialLiquidity,
    creatorFee,
    { value: initialLiquidity }
  );
  
  const receipt = await tx.wait();
  console.log("Market created! Transaction hash:", receipt.hash);

  // Get market details
  const marketId = 0; // Assuming this is the first market
  const marketData = await market.getMarket(marketId);
  console.log("\nMarket Details:");
  console.log("Question:", marketData.question);
  console.log("Creator:", marketData.creator);
  console.log("End Time:", new Date(Number(marketData.endTime) * 1000).toLocaleString());
  console.log("State:", marketData.state);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

