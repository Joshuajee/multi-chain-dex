// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { expect } from "chai";
// import { ethers } from "hardhat";

// describe("MDexFactory", function () {
//     // We define a fixture to reuse the same setup in every test.
//     // We use loadFixture to run this setup once, snapshot that state,
//     // and reset Hardhat Network to that snapshot in every test.
//     async function deploy() {

//         // Contracts are deployed using the first signer/account by default
//         const [owner, one, two, three, four] = await ethers.getSigners();

//         const MDexFactory = await ethers.getContractFactory("MDexFactory");
//         const mDexFactory = await MDexFactory.connect(owner).deploy(1);

//         return { mDexFactory, owner, one, two, three, four};
//     }



//     async function initialize() {

//         const { mDexFactory, owner, one, two, three, four} = await deploy()

//         const Mailbox = await ethers.getContractFactory("Mailbox");
//         const mailbox = await Mailbox.connect(owner).deploy(1000);

//         // const Mailbox = await ethers.getContractFactory("Mailbox");
//         const interchainGasPaymaster = await Mailbox.connect(owner).deploy(1000);

//         // const Mailbox = await ethers.getContractFactory("Mailbox");
//         const interchainSecurityModule = await Mailbox.connect(owner).deploy(1000);
        
//         await mDexFactory.initialize(mailbox.address, interchainGasPaymaster.address, interchainSecurityModule.address)


//         return { mDexFactory, owner, one, two, three, four};
//     }

//     describe("Deployment", function () {

//         it("Domain Should be set correctly", async function () {
//             const [owner] = await ethers.getSigners();
//             const MDexFactory = await ethers.getContractFactory("MDexFactory");
//             const mDexFactory = await MDexFactory.connect(owner).deploy(1);
//             expect(await mDexFactory.LOCAL_DOMAIN()).to.be.equal(1)
//         });

//         it("Pair length should be zero", async function () {
//             const { mDexFactory } = await loadFixture(deploy);
//             expect(await mDexFactory.allPairsLength()).to.equal(0);
//         });

//         it("Should initialize with the right Info", async function () {
//             const { mDexFactory, owner } = await loadFixture(deploy);

//             const Mailbox = await ethers.getContractFactory("Mailbox");
//             const mailbox = await Mailbox.connect(owner).deploy(1000);

//             // const Mailbox = await ethers.getContractFactory("Mailbox");
//             const interchainGasPaymaster = await Mailbox.connect(owner).deploy(1000);

//             // const Mailbox = await ethers.getContractFactory("Mailbox");
//             const interchainSecurityModule = await Mailbox.connect(owner).deploy(1000);
            
//             await mDexFactory.initialize(mailbox.address, interchainGasPaymaster.address, interchainSecurityModule.address)
    
//             expect(await mDexFactory.mailbox()).to.be.equal(mailbox.address)

//             expect(await mDexFactory.interchainGasPaymaster()).to.be.equal(interchainGasPaymaster.address)

//             expect(await mDexFactory.interchainSecurityModule()).to.be.equal(interchainSecurityModule.address)

//         });

//     });

//     describe("Pair Creation", function () {


//         // it("Should create pairs with right info, if the chains are the different", async function () {
            
//         //     const { mDexFactory, one, two, three, four } = await loadFixture(deploy);
            
//         //     await mDexFactory.createPair(10, 10000, one.address, two.address, three.address, four.address);

//         //     expect(await mDexFactory.allPairsLength()).to.equal(1);

//         //     //console.log(await mDexFactory.getPair(1, 2))

//         //     //expect(await mDexFactory.getPair(1, 2)).to.be.addre;

//         //     //await expect(mDexFactory.createPair(1, 2)).not.to.reverted()

//         // });


//     // it("Should emit an event on withdrawals", async function () {
//     //     const { lock, unlockTime, lockedAmount } = await loadFixture(
//     //       deployOneYearLockFixture
//     //     );

//     //     await time.increaseTo(unlockTime);

//     //     await expect(lock.withdraw())
//     //       .to.emit(lock, "Withdrawal")
//     //       .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg

//     // });

//   });

// });
