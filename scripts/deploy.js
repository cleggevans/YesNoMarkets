const hre = require("hardhat");

async function main() {
  console.log("Deploying YesNoMarket contract...");

  // Get deployment parameters from environment variables
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  const feeRecipientAddress = process.env.FEE_RECIPIENT_ADDRESS || "0x0000000000000000000000000000000000000000";

  if (feeRecipientAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("Warning: FEE_RECIPIENT_ADDRESS not set, using deployer address");
  }

  // Get the contract factory
  const YesNoMarket = await hre.ethers.getContractFactory("YesNoMarket");

  // Deploy the contract
  const yesNoMarket = await YesNoMarket.deploy(
    paymentTokenAddress,
    feeRecipientAddress || (await hre.ethers.getSigners())[0].address
  );

  await yesNoMarket.waitForDeployment();

  const contractAddress = await yesNoMarket.getAddress();
  console.log("YesNoMarket deployed to:", contractAddress);
  console.log("Payment Token:", paymentTokenAddress === "0x0000000000000000000000000000000000000000" ? "Native BNB" : paymentTokenAddress);
  console.log("Fee Recipient:", feeRecipientAddress || (await hre.ethers.getSigners())[0].address);

  // Wait for a few block confirmations before verification
  console.log("Waiting for block confirmations...");
  await yesNoMarket.deploymentTransaction()?.wait(5);

  // Verify contract on BscScan if API key is provided
  if (process.env.BSCSCAN_API_KEY) {
    console.log("Verifying contract on BscScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [paymentTokenAddress, feeRecipientAddress || (await hre.ethers.getSigners())[0].address],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

