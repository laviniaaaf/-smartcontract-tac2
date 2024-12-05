const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Lock", function () {
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });
    await lock.waitForDeployment();

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.unlockTime()).to.equal(BigInt(unlockTime));
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture);
      const target = await lock.getAddress();
      expect(await ethers.provider.getBalance(target)).to.equal(BigInt(lockedAmount));
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      try {
        await Lock.deploy(latestTime, { value: 1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Unlock time should be in the future");
      }
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);
        try {
          await lock.withdraw();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("You can't withdraw yet");
        }
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        try {
          await lock.connect(otherAccount).withdraw();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("You aren't the owner");
        }
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        // If this doesn't throw, the test passes
        await lock.withdraw();
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        const tx = await lock.withdraw();
        const receipt = await tx.wait();
        
        const event = receipt.logs[0];
        const decodedEvent = lock.interface.parseLog(event);
        
        expect(decodedEvent.name).to.equal("Withdrawal");
        expect(decodedEvent.args[0]).to.equal(BigInt(lockedAmount));
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        const target = await lock.getAddress();
        const initialContractBalance = await ethers.provider.getBalance(target);
        await lock.withdraw();
        const finalContractBalance = await ethers.provider.getBalance(target);

        expect(finalContractBalance).to.equal(0n);
        expect(initialContractBalance).to.equal(BigInt(lockedAmount));
      });
    });
  });
});
