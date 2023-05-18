import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MDexV1NativeFactory,  MockMailbox  } from "../typechain-types";



describe("Liquidity Pool", function () {

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

        const MDexV1PairClone = await ethers.getContractFactory("MDexV1PairNative");

        const mDexV1PairClone  = await MDexV1PairClone.deploy();
        const mDexV1PairClone2  = await MDexV1PairClone.deploy();


        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
        const mDexV1NativeFactory = await MDexV1NativeFactory.deploy(originDomain, mDexV1PairClone.address);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.deploy(remoteDomain, mDexV1PairClone2.address);

        //InterchainGasMaster
        const MIGP = await ethers.getContractFactory("MockInterchainGasPaymaster");

        const interchainGasPaymaster1 = await MIGP.deploy();
        const interchainGasPaymaster2 = await MIGP.deploy();

        await interchainGasPaymaster1.setExchangeRate(remoteDomain, 1)
        await interchainGasPaymaster1.setExchangeRate(originDomain, 5)
        //End InterchainGasMaster

        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address)

        await mDexV1NativeFactory2.initialize(mockMailbox2.address, interchainGasPaymaster2.address)

        await mDexV1NativeFactory.createPair({remoteDomain, amountIn1, amountIn2, gasAmount, remoteAddress: mDexV1NativeFactory2.address }, { value: gas })

        await mockMailbox2.processNextInboundMessage()

        const pair1 = await mDexV1NativeFactory.allPairs(0)

        const pair2 = await mDexV1NativeFactory2.allPairs(0)

        const pair1Contract = await ethers.getContractAt("MDexV1PairNative", pair1);

        const pair2Contract = await ethers.getContractAt("MDexV1PairNative", pair2);

        return { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }

    async function addLiquidity() {

        const  { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four} = await loadFixture(deploy);

        await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

        await mockMailbox.processNextInboundMessage()

        return  { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four}

    }



    describe("Validating Pair Info", function () {

        it("Contract 1 should have the right values on creation", async function () {

            const { pair1Contract, mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(deploy);

            expect(await pair1Contract.positionCounter()).to.be.equal(1)

            expect(await pair1Contract.factory()).to.be.equal(mDexV1NativeFactory.address)

            expect(await pair1Contract.remoteAddress()).to.be.equal(mDexV1NativeFactory2.address)

            expect(await pair1Contract.LOCAL_DOMAIN()).to.be.equal(originDomain)

            expect(await pair1Contract.REMOTE_DOMAIN()).to.be.equal(remoteDomain)

            expect(await pair1Contract.reserve1()).to.be.equal(0)

            expect(await pair1Contract.reserve2()).to.be.equal(0)

            expect(await pair1Contract.kValue()).to.be.equal(0)

        });



        it("Contract 2 should have the right values on creation", async function () {

            const { pair2Contract, mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(deploy);

            expect(await pair2Contract.positionCounter()).to.be.equal(1)

            expect(await pair2Contract.factory()).to.be.equal(mDexV1NativeFactory2.address)

            expect(await pair2Contract.remoteAddress()).to.be.equal(mDexV1NativeFactory.address)

            expect(await pair2Contract.LOCAL_DOMAIN()).to.be.equal(remoteDomain)

            expect(await pair2Contract.REMOTE_DOMAIN()).to.be.equal(originDomain)

            expect(await pair2Contract.reserve1()).to.be.equal(0)

            expect(await pair2Contract.reserve2()).to.be.equal(0)

            expect(await pair2Contract.kValue()).to.be.equal(0)

        });

    })


    describe("Adding Liquidity", function () {

        describe("Validations", function () {

            it("Should add Liquidity to both contracts", async function () {

                const { mockMailbox, mockMailbox2, one, mDexV1NativeFactory, mDexV1NativeFactory2, pair1Contract, pair2Contract } = await loadFixture(deploy);

                await mDexV1NativeFactory.connect(one).addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.connect(one).addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                expect(await pair1Contract.positionCounter()).to.be.equal(2)

                expect(await pair2Contract.positionCounter()).to.be.equal(2)

            });

            it("Should add Liquidity to opened Positions, when Liquity is added to both contract by same user", async function () {

                const { mockMailbox, mockMailbox2, one, owner, mDexV1NativeFactory, mDexV1NativeFactory2, pair1Contract, pair2Contract } = await loadFixture(deploy);

                await mDexV1NativeFactory.connect(one).addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.connect(one).addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                expect(await pair1Contract.positionCounter()).to.be.equal(2)

                expect(await pair2Contract.positionCounter()).to.be.equal(2)

                expect(await pair1Contract.openPositionArray(0)).to.be.equal(2)

                expect(await pair2Contract.openPositionArray(0)).to.be.equal(2)

            });

            it("Should add Liquidity to User Open Liquidity, when Liquity is added to both contract by same user", async function () {

                const { mockMailbox, mockMailbox2, one, two, mDexV1NativeFactory, mDexV1NativeFactory2, pair1Contract, pair2Contract } = await loadFixture(deploy);

                await mDexV1NativeFactory.connect(one).addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.connect(one).addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                await mDexV1NativeFactory.connect(two).addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.connect(two).addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                const first =  await mDexV1NativeFactory.userOpenPositions(one.address, 0)
                const first2 = await mDexV1NativeFactory.userOpenPositions(two.address, 0)

                const first_ =  await mDexV1NativeFactory2.userOpenPositions(one.address, 0)
                const first_2 = await mDexV1NativeFactory2.userOpenPositions(two.address, 0)


                expect(first.positionId).to.be.equal(first_.positionId)

                expect(first2.positionId).to.be.equal(first_2.positionId)

            });

            it("Should add Liquidity to User Open Liquidity, when Liquity is added to both contract by same user, Pair 2", async function () {

                const { mockMailbox, mockMailbox2, one, two, mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(deploy);

                await mDexV1NativeFactory2.connect(one).addLiquidity(originDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                await mDexV1NativeFactory.connect(one).addLiquidity(remoteDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.connect(two).addLiquidity(originDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                await mDexV1NativeFactory.connect(two).addLiquidity(remoteDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                const first =  await mDexV1NativeFactory.userOpenPositions(one.address, 0)
                const first2 = await mDexV1NativeFactory.userOpenPositions(two.address, 0)

                const first_ =  await mDexV1NativeFactory2.userOpenPositions(one.address, 0)
                const first_2 = await mDexV1NativeFactory2.userOpenPositions(two.address, 0)


                expect(first.positionId).to.be.equal(first_.positionId)

                expect(first2.positionId).to.be.equal(first_2.positionId)

            });

            it("Contract Balance and reserves should be increase to amount in both contract", async function () {

                const { mockMailbox,mDexV1NativeFactory, mDexV1NativeFactory2, pair1Contract, pair2Contract } = await loadFixture(deploy);

                const balance1 = await ethers.provider.getBalance(pair1Contract.address);

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                const balance2 = await ethers.provider.getBalance(pair2Contract.address);

                expect(balance1).to.be.equal(amountIn1)
                expect(balance2).to.be.equal(amountIn2)

                expect(await pair1Contract.reserve1()).to.be.equal(amountIn1)
                expect(await pair1Contract.reserve2()).to.be.equal(amountIn2)

                expect(await pair2Contract.reserve1()).to.be.equal(amountIn2)
                expect(await pair2Contract.reserve2()).to.be.equal(amountIn1)

            });

        })

    })


    describe("Swaping Assets", function () {

        describe("Validations", function () {

            it("Balances should update with right details during Swap from pair One", async function () {

                const { mockMailbox2, pair1, pair2, pair1Contract, mDexV1NativeFactory, mDexV1NativeFactory2, owner } = await loadFixture(addLiquidity);

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(pair2);

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const gas = ethers.utils.parseUnits("2.1", "ether");

                await mDexV1NativeFactory.swap(remoteDomain, amountIn, 1000, owner.address, mDexV1NativeFactory2.address, { value: gas})

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(pair2);

                await mockMailbox2.processNextInboundMessage()

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(pair2);

                expect(balance1_1).to.be.greaterThan(balance1)
                expect(balance2_1).to.be.equal(balance2)
                expect(balance1_2).to.be.greaterThan(balance1)
                expect(balance2_2).to.be.lessThan(balance2)

            });

            it("Balances should update with right details during Swap from pair Two", async function () {

                const { mockMailbox, pair1, pair2, mDexV1NativeFactory, mDexV1NativeFactory2, owner } = await loadFixture(addLiquidity);

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(pair2);

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const gas = ethers.utils.parseUnits("2.1", "ether");

                await mDexV1NativeFactory2.swap(originDomain, amountIn, 1000, owner.address, mDexV1NativeFactory.address, { value: gas})

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(pair2);

                await mockMailbox.processNextInboundMessage()

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(pair2);

                expect(balance1_1).to.be.equal(balance1)
                expect(balance2_1).to.be.greaterThan(balance2)
                expect(balance1_2).to.be.lessThan(balance1)
                expect(balance2_2).to.be.greaterThan(balance2)

            });

            it("Fees should be paid on token swap", async function () {

                const { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair2Contract, pair1Contract, owner, one, two, three, four } = await loadFixture(addLiquidity);

                const amount_1 = ethers.utils.parseUnits("50", "ether");
                const amountIn2_1 = ethers.utils.parseUnits("10", "ether");

                const amount_2 = ethers.utils.parseUnits("25", "ether");
                const amountIn2_2 = ethers.utils.parseUnits("5", "ether");

                //------1--------
                await mDexV1NativeFactory.addLiquidity(remoteDomain, amount_1, amountIn2_1, gasAmount, mDexV1NativeFactory2.address, { value: gas })

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2_1, amount_1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                //------2--------
                await mDexV1NativeFactory.addLiquidity(remoteDomain, amount_2, amountIn2_2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2_2, amount_2, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()
                //------END--------

                const amountIn = ethers.utils.parseUnits("2", "ether");

                await mDexV1NativeFactory.swap(remoteDomain, amountIn, 1000, owner.address, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                const total = amountIn1.add(amount_1).add(amount_2).add(amountIn1)

                const PERCENT = 100

                console.log(total)

                const fee1 = amountIn1.div(PERCENT)

                const payout1 = (amountIn1.mul(fee1)).div(total);

                console.log(fee1)

                console.log(payout1)

                //expect((await pair1Contract.positions(1)).availableFees).to.be.equal(amountIn1.mul(percent).div(total))

                // console.log(await pair1Contract.positions(1))

                // console.log(await pair1Contract.positions(2))

                // console.log(await pair1Contract.positions(3))

                // console.log(await pair1Contract.positions(4))

                // console.log(await pair1Contract.positions(5))

            });



            it("Owner Can withdraw fee after swap", async function () {

                const { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair1Contract, owner, one, two, three, four } = await loadFixture(addLiquidity);

                const amount_1 = ethers.utils.parseUnits("50", "ether");
                const amountIn2_1 = ethers.utils.parseUnits("10", "ether");

                const amount_2 = ethers.utils.parseUnits("25", "ether");
                const amountIn2_2 = ethers.utils.parseUnits("5", "ether");

                //------1--------
                await mDexV1NativeFactory.addLiquidity(remoteDomain, amount_1, amountIn2_1, gasAmount, mDexV1NativeFactory2.address, { value: gas })

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2_1, amount_1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                //------2--------
                await mDexV1NativeFactory.addLiquidity(remoteDomain, amount_2, amountIn2_2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2_2, amount_2, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()
                //------END--------

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await mDexV1NativeFactory.swap(remoteDomain, amountIn, 1000, owner.address, mDexV1NativeFactory2.address, { value: _gas})

                await mockMailbox2.processNextInboundMessage()

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(owner.address);

                await pair1Contract.collectFee(1)

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(owner.address);

                expect(balance1_1).to.be.greaterThan(balance1_2)

                expect(balance2_1).to.be.lessThan(balance2_2)

            });

        })


        describe("Liquidity Provider", function () {


            it("Get all opened from a Liquidity Provider", async function () {

                const { mockMailbox, mockMailbox2, mDexV1NativeFactory, mDexV1NativeFactory2, pair1Contract, pair2Contract, owner, one} = await loadFixture(addLiquidity);

                await mDexV1NativeFactory.addLiquidity(remoteDomain, amountIn1, amountIn2, gasAmount, mDexV1NativeFactory2.address, { value: gas})

                await mockMailbox2.processNextInboundMessage()

                await mDexV1NativeFactory2.addLiquidity(originDomain, amountIn2, amountIn1, gasAmount, mDexV1NativeFactory.address, { value: gas})

                await mockMailbox.processNextInboundMessage()

                const positions = await pair1Contract.getOpenedPositionsByAddress(owner.address)

                console.log(positions[1])

                expect(positions.length).to.be.equal(2)

                console.log((await pair2Contract.getOpenedPositionsByAddress(owner.address))[1])

                expect(positions[0].amountIn1).to.be.equal(amountIn1)
                expect(positions[0].amountIn2).to.be.equal(amountIn2)

            });

            it("Liquidity Provider Can withdraw fees after swap", async function () {

                const { mockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, pair2, pair2Contract, owner, one } = await loadFixture(addLiquidity);

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");
    
                await mDexV1NativeFactory2.connect(one).swap(originDomain, amountIn, 1000, owner.address, mDexV1NativeFactory.address, { value: _gas})

                await mockMailbox.processNextInboundMessage()

                const balance1 = await ethers.provider.getBalance(pair2);
                const balance2 = await ethers.provider.getBalance(owner.address);

                const position = await pair2Contract.positions(1)

                await pair2Contract.collectFee(1)

                expect((await pair2Contract.positions(1)).availableFees).to.be.lessThan(position.availableFees)
                expect((await pair2Contract.positions(1)).totalFees).to.be.equal(position.totalFees)

                expect(await ethers.provider.getBalance(pair2)).to.be.equal(BigInt(balance1 as any) - BigInt(position.availableFees as any))
                expect(await ethers.provider.getBalance(owner.address)).to.be.greaterThan(balance2)

            });


            it("Cannot collect fees, if you are not the Liquidity Provider", async function () {

                const { mockMailbox, pair1Contract, mDexV1NativeFactory2, mDexV1NativeFactory, owner, one} = await loadFixture(addLiquidity);

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await mDexV1NativeFactory2.connect(one).swap(originDomain, amountIn, 1000, owner.address, mDexV1NativeFactory.address, { value: _gas})

                await mockMailbox.processNextInboundMessage()

                await expect(pair1Contract.connect(one).collectFee(1)).to.be.revertedWith("MDEX: NOT OWNER")

            });

            it("Get All Open Position in an address", async function () {

                const { mockMailbox, mDexV1NativeFactory2, mDexV1NativeFactory, pair1Contract, owner, one } = await loadFixture(addLiquidity);

                const amountIn = ethers.utils.parseUnits("2", "ether");

                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await mDexV1NativeFactory2.connect(one).swap(originDomain, amountIn, 1000, owner.address, mDexV1NativeFactory.address, { value: _gas})

                await mockMailbox.processNextInboundMessage()

                await expect(pair1Contract.connect(one).collectFee(1)).to.be.revertedWith("MDEX: NOT OWNER")

            });

            // it("Get All Open Position in an address", async function () {

            //     const { mockMailbox, mDexV1NativeFactory2, mDexV1NativeFactory, pair1Contract, owner, one } = await loadFixture(addLiquidity);

            //     const amountIn = ethers.utils.parseUnits("2", "ether");
            //     const _gas = ethers.utils.parseUnits("2.1", "ether");

            //     await mDexV1NativeFactory2.connect(one).swap(originDomain, amountIn, 1000, owner.address, mDexV1NativeFactory.address, { value: _gas})

            //     await mockMailbox.processNextInboundMessage()

            //     await expect(pair1Contract.connect(one).collectFee(1)).to.be.revertedWith("MDEX: NOT OWNER")

            // });

        })

    });

});