import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MDexFactory", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MDexFactory = await ethers.getContractFactory("MDexFactory");
        const mDexFactory = await MDexFactory.deploy();

        return { mDexFactory, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Pair length should be zero", async function () {
            const { mDexFactory } = await loadFixture(deploy);
            expect(await mDexFactory.allPairsLength()).to.equal(0);
        });

    });

    describe("Pair Creation", function () {

        it("Should revert with the right error if the chains are the same", async function () {
            const { mDexFactory } = await loadFixture(deploy);

            await expect(mDexFactory.createPair(1, 1)).to.be.revertedWith(
                "MDEX: IDENTICAL_CHAIN"
            );
        });


        it("Should create pairs with right info, if the chains are the different", async function () {
            const { mDexFactory } = await loadFixture(deploy);

            await mDexFactory.createPair(1, 2);

            expect(await mDexFactory.allPairsLength()).to.equal(1);

            //console.log(await mDexFactory.getPair(1, 2))

            //expect(await mDexFactory.getPair(1, 2)).to.be.addre;

            //await expect(mDexFactory.createPair(1, 2)).not.to.reverted()

        });


    // it("Should emit an event on withdrawals", async function () {
    //     const { lock, unlockTime, lockedAmount } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     await time.increaseTo(unlockTime);

    //     await expect(lock.withdraw())
    //       .to.emit(lock, "Withdrawal")
    //       .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg

    // });

  });

});
