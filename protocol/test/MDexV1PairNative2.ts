import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";




describe("Liquidity Pool Test", function () {

    const originDomain = 1000
    const remoteDomain = 2000

    const amountIn1 = ethers.utils.parseUnits("100", "ether");
    const amountIn2 = ethers.utils.parseUnits("20", "ether");

    const gas = ethers.utils.parseUnits("101", "ether");
    const gasAmount = ethers.utils.parseUnits("0.01", "ether");


    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();


        // MailBox
        const MockMailbox = await ethers.getContractFactory("MockMailbox");

        const mockMailbox = await MockMailbox.deploy(originDomain);
        const mockMailbox2 = await MockMailbox.deploy(remoteDomain);

        // adding remote
        await mockMailbox.addRemoteMailbox(remoteDomain, mockMailbox2.address);
        await mockMailbox2.addRemoteMailbox(originDomain, mockMailbox.address);

        const MDexV1CloneFactory = await ethers.getContractFactory("MDexV1CloneFactory");

        const mDexV1CloneFactory  = await MDexV1CloneFactory.deploy();
        const mDexV1CloneFactory2  = await MDexV1CloneFactory.deploy();


        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
        const mDexV1NativeFactory = await MDexV1NativeFactory.deploy(originDomain, mDexV1CloneFactory.address);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.deploy(remoteDomain, mDexV1CloneFactory2.address);

        //InterchainGasMaster
        const MIGP = await ethers.getContractFactory("MockInterchainGasPaymaster");

        const interchainGasPaymaster1 = await MIGP.connect(owner).deploy();
        const interchainGasPaymaster2 = await MIGP.connect(owner).deploy();

        await interchainGasPaymaster1.setExchangeRate(remoteDomain, 1)
        await interchainGasPaymaster1.setExchangeRate(originDomain, 5)
        //End InterchainGasMaster

        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address)

        await mDexV1NativeFactory2.initialize(mockMailbox2.address, interchainGasPaymaster2.address)

        await mDexV1NativeFactory.createPair({ remoteDomain, amountIn1, amountIn2, gasAmount: 10, remoteAddress: mDexV1NativeFactory2.address }, { value: gas })

        await mockMailbox2.processNextInboundMessage()

        const pair1 = await mDexV1NativeFactory.allPairs(0)

        const pair2 = await mDexV1NativeFactory2.allPairs(0)

        const pair1Contract = await ethers.getContractAt("MDexV1PairNative", pair1);

        const pair2Contract = await ethers.getContractAt("MDexV1PairNative", pair2);

        await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

        await mockMailbox.processNextInboundMessage()

        await mDexV1NativeFactory.addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

        await mockMailbox2.processNextInboundMessage()

        await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

        await mockMailbox.processNextInboundMessage()

        await mDexV1NativeFactory.addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

        await mockMailbox2.processNextInboundMessage()

        await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

        await mockMailbox.processNextInboundMessage()

        await mDexV1NativeFactory.addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

        await mockMailbox2.processNextInboundMessage()

        await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

        await mockMailbox.processNextInboundMessage()

        return { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }

    describe("Liquidity Provider", function () {

        it("Get All Open Position in an owner address and pending postions should be zero", async function () {

            const { mockMailbox, mDexV1NativeFactory2, mDexV1NativeFactory, pair1Contract, owner, one } = await loadFixture(deploy);

            const opened1 = await mDexV1NativeFactory.getUserOpenPositions(owner.address)

            const opened2 = await mDexV1NativeFactory2.getUserOpenPositions(owner.address)

            const pending1 = await mDexV1NativeFactory.getUserPendingPositions(owner.address)

            const pending2 = await mDexV1NativeFactory2.getUserPendingPositions(owner.address)

            expect(opened1.length).to.be.equal(opened2.length)

            expect(pending1.length).to.be.equal(0)

            expect(pending2.length).to.be.equal(0)

        });

        it("Should add Liquidity to Pending on both chain", async function () {

            const { mockMailbox2, one, mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(deploy);

            await mDexV1NativeFactory.connect(one).addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

            await mockMailbox2.processNextInboundMessage()

            const opened1 = await mDexV1NativeFactory.getUserOpenPositions(one.address)

            const opened2 = await mDexV1NativeFactory2.getUserOpenPositions(one.address)

            const pending1 = await mDexV1NativeFactory.getUserPendingPositions(one.address)

            const pending2 = await mDexV1NativeFactory2.getUserPendingPositions(one.address)

            expect(opened1.length).to.be.equal(0)

            expect(opened2.length).to.be.equal(0)

            expect(pending1.length).to.be.equal(1)

            expect(pending2.length).to.be.equal(1)

        });


        // it("Should be able to remove Liquidity", async function () {

        //     const { mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, owner } = await loadFixture(deploy);

        //     const opened1 = await mDexV1NativeFactory.getUserOpenPositions(owner.address)

        //     const opened2 = await mDexV1NativeFactory2.getUserOpenPositions(owner.address)

        //     await mDexV1NativeFactory.removeLiquidity(remoteDomain, 1, 1000, mDexV1NativeFactory2.address, { value: 100 })

        //     await mockMailbox2.processNextInboundMessage()

        //     const opened1_2 = await mDexV1NativeFactory.getUserOpenPositions(owner.address)

        //     const opened2_2 = await mDexV1NativeFactory2.getUserOpenPositions(owner.address)

        //     expect(opened1_2.length).to.be.equal(opened1.length - 1)

        //     expect(opened2_2.length).to.be.equal(opened2.length - 1)


        //     //expect((await mDexV1NativeFactory.getUserOpenPositions(owner.address))[0]).to.be.equal((await mDexV1NativeFactory2.getUserOpenPositions(owner.address))[0])

        // });


    })


});