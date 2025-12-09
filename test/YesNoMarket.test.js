const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YesNoMarket", function () {
  let yesNoMarket;
  let owner;
  let user1;
  let user2;
  let feeRecipient;

  beforeEach(async function () {
    [owner, user1, user2, feeRecipient] = await ethers.getSigners();

    const YesNoMarket = await ethers.getContractFactory("YesNoMarket");
    yesNoMarket = await YesNoMarket.deploy(
      ethers.ZeroAddress, // Native BNB
      feeRecipient.address
    );
    await yesNoMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await yesNoMarket.owner()).to.equal(owner.address);
      expect(await yesNoMarket.platformFee()).to.equal(200); // 2%
    });
  });

  describe("Market Creation", function () {
    it("Should create a new market", async function () {
      const question = "Will Bitcoin reach $100k by 2025?";
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const initialLiquidity = ethers.parseEther("1.0");

      const tx = await yesNoMarket.connect(user1).createMarket(
        question,
        endTime,
        initialLiquidity,
        100, // 1% creator fee
        { value: initialLiquidity }
      );

      await expect(tx).to.emit(yesNoMarket, "MarketCreated");

      const market = await yesNoMarket.getMarket(0);
      expect(market.creator).to.equal(user1.address);
      expect(market.question).to.equal(question);
      expect(market.state).to.equal(0); // Open
    });

    it("Should reject market creation with empty question", async function () {
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const initialLiquidity = ethers.parseEther("1.0");

      await expect(
        yesNoMarket.connect(user1).createMarket("", endTime, initialLiquidity, 100, {
          value: initialLiquidity,
        })
      ).to.be.revertedWith("Question cannot be empty");
    });

    it("Should reject market creation with end time too soon", async function () {
      const question = "Test question";
      const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour (less than 1 day)
      const initialLiquidity = ethers.parseEther("1.0");

      await expect(
        yesNoMarket.connect(user1).createMarket(question, endTime, initialLiquidity, 100, {
          value: initialLiquidity,
        })
      ).to.be.revertedWith("End time too soon");
    });
  });

  describe("Buying Shares", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will Ethereum reach $5000?";
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const initialLiquidity = ethers.parseEther("10.0");

      const tx = await yesNoMarket.connect(user1).createMarket(
        question,
        endTime,
        initialLiquidity,
        100,
        { value: initialLiquidity }
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = yesNoMarket.interface.parseLog(log);
          return parsed && parsed.name === "MarketCreated";
        } catch {
          return false;
        }
      });
      marketId = 0;
    });

    it("Should allow buying YES shares", async function () {
      const shares = ethers.parseEther("1.0");
      const cost = await yesNoMarket.calculateCost(marketId, true, shares);

      await expect(
        yesNoMarket.connect(user2).buyShares(marketId, true, shares, { value: cost })
      ).to.emit(yesNoMarket, "SharesBought");

      const userShares = await yesNoMarket.getUserShares(marketId, user2.address);
      expect(userShares.yesShares).to.equal(shares);
    });

    it("Should allow buying NO shares", async function () {
      const shares = ethers.parseEther("1.0");
      const cost = await yesNoMarket.calculateCost(marketId, false, shares);

      await expect(
        yesNoMarket.connect(user2).buyShares(marketId, false, shares, { value: cost })
      ).to.emit(yesNoMarket, "SharesBought");

      const userShares = await yesNoMarket.getUserShares(marketId, user2.address);
      expect(userShares.noShares).to.equal(shares);
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will BNB reach $1000?";
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const initialLiquidity = ethers.parseEther("10.0");

      await yesNoMarket.connect(user1).createMarket(
        question,
        endTime,
        initialLiquidity,
        100,
        { value: initialLiquidity }
      );
      marketId = 0;
    });

    it("Should allow creator to resolve market", async function () {
      // Fast forward time (in real scenario, would use time manipulation)
      // For now, we'll test with a market that's already past end time
      const question = "Test question";
      const endTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const initialLiquidity = ethers.parseEther("10.0");

      await yesNoMarket.connect(user1).createMarket(
        question,
        endTime,
        initialLiquidity,
        100,
        { value: initialLiquidity }
      );

      await expect(
        yesNoMarket.connect(user1).resolveMarket(1, true)
      ).to.emit(yesNoMarket, "MarketResolved");
    });

    it("Should not allow non-creator to resolve market", async function () {
      const endTime = Math.floor(Date.now() / 1000) - 3600;
      const question = "Test question 2";
      const initialLiquidity = ethers.parseEther("10.0");

      await yesNoMarket.connect(user1).createMarket(
        question,
        endTime,
        initialLiquidity,
        100,
        { value: initialLiquidity }
      );

      await expect(
        yesNoMarket.connect(user2).resolveMarket(2, true)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to set platform fee", async function () {
      await yesNoMarket.connect(owner).setPlatformFee(300); // 3%
      expect(await yesNoMarket.platformFee()).to.equal(300);
    });

    it("Should not allow non-owner to set platform fee", async function () {
      await expect(
        yesNoMarket.connect(user1).setPlatformFee(300)
      ).to.be.revertedWithCustomError(yesNoMarket, "OwnableUnauthorizedAccount");
    });

    it("Should reject fee that's too high", async function () {
      await expect(
        yesNoMarket.connect(owner).setPlatformFee(10001)
      ).to.be.revertedWith("Fee too high");
    });
  });
});

