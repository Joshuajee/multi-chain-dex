import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MDexV1NativeFactory,  MockMailbox  } from "../typechain-types";



describe("Liquidity Pool", function () {

    const originDomain = 1000
    const remoteDomain = 2000

    const amount = ethers.utils.parseUnits("100", "ether");
    const amount2 = ethers.utils.parseUnits("20", "ether");
    
    const gas = ethers.utils.parseUnits("101", "ether");
    const gasAmount = ethers.utils.parseUnits("0.01", "ether");


    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();


        // MailBox
        const MockMailbox = await ethers.getContractFactory("MockMailbox");
        const mockMailbox = await MockMailbox.deploy(originDomain);

        // adding remote
        await mockMailbox.addRemoteMailbox(originDomain, mockMailbox.address);
        await mockMailbox.addRemoteMailbox(remoteDomain, mockMailbox.address);

        const MDexV1CloneFactory = await ethers.getContractFactory("MDexV1CloneFactory");

        const mDexV1CloneFactory  = await MDexV1CloneFactory.connect(owner).deploy();
        const mDexV1CloneFactory2  = await MDexV1CloneFactory.connect(owner).deploy();


        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
        const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(originDomain, mDexV1CloneFactory.address);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.connect(owner).deploy(remoteDomain, mDexV1CloneFactory2.address);

        //InterchainGasMaster
        const MIGP = await ethers.getContractFactory("MockInterchainGasPaymaster");

        const interchainGasPaymaster1 = await MIGP.connect(owner).deploy();
        const interchainGasPaymaster2 = await MIGP.connect(owner).deploy();

        await interchainGasPaymaster1.setExchangeRate(remoteDomain, 1)
        await interchainGasPaymaster1.setExchangeRate(originDomain, 5)
        //End InterchainGasMaster

        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address)

        await mDexV1NativeFactory2.initialize(mockMailbox.address, interchainGasPaymaster2.address)

        await mDexV1NativeFactory.createPair(remoteDomain, 100, mDexV1NativeFactory2.address, { value: 100000})

        await mockMailbox.processNextInboundMessage()

        const pair1 = await mDexV1NativeFactory.allPairs(0)

        const pair2 = await mDexV1NativeFactory2.allPairs(0)

        const pair1Contract = await ethers.getContractAt("MDexV1PairNative", pair1);

        const pair2Contract = await ethers.getContractAt("MDexV1PairNative", pair2);

        return { mockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }

    async function addLiquidity() {

        const  { mockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four} = await loadFixture(deploy);

        await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
        
        mockMailbox.processNextInboundMessage()

        await pair1Contract.addLiquidity(amount2, amount, gasAmount, owner.address, { value: gas})
        
        mockMailbox.processNextInboundMessage()

        return  { mockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four}

    
    }



    describe("Validating Pair Info", function () {

        it("Contract 1 should have the right values on creation", async function () {

            const { pair1Contract, mDexV1NativeFactory } = await loadFixture(deploy);

            expect(await pair1Contract.positionCounter()).to.be.equal(0)

            expect(await pair1Contract.factory()).to.be.equal(mDexV1NativeFactory.address)

            expect(await pair1Contract.remoteAddress()).to.be.equal(ethers.constants.AddressZero)

            expect(await pair1Contract.LOCAL_DOMAIN()).to.be.equal(originDomain)

            expect(await pair1Contract.REMOTE_DOMAIN()).to.be.equal(remoteDomain)

            expect(await pair1Contract.reserve1()).to.be.equal(0)

            expect(await pair1Contract.reserve2()).to.be.equal(0)

            expect(await pair1Contract.kValue()).to.be.equal(0)

        });



        it("Contract 2 should have the right values on creation", async function () {

            const { pair1Contract, pair2Contract, mDexV1NativeFactory2 } = await loadFixture(deploy);

            expect(await pair2Contract.positionCounter()).to.be.equal(0)

            expect(await pair2Contract.factory()).to.be.equal(mDexV1NativeFactory2.address)

            expect(await pair2Contract.remoteAddress()).to.be.equal(pair1Contract.address)

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

                const { mockMailbox, owner, pair1Contract, pair2Contract } = await loadFixture(deploy);

                await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                expect(await pair1Contract.positionCounter()).to.be.equal(1)

                expect(await pair2Contract.positionCounter()).to.be.equal(1)

                await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

            });


            it("Should add Liquidity to opened Positions, when Liquity is added to both contract by same user", async function () {

                const { mockMailbox, owner, pair1Contract, pair2Contract } = await loadFixture(deploy);

                await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                await pair1Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                expect(await pair2Contract.positionCounter()).to.be.equal(1)

                expect(await pair1Contract.openPositionArray(0)).to.be.equal(1)

            });

            it("Contract Balance should be increase to amount", async function () {

                const { mockMailbox, pair1, pair2, pair1Contract, pair2Contract, owner } = await loadFixture(deploy);

                const balance1 = await ethers.provider.getBalance(pair1);

                const balance2 = await ethers.provider.getBalance(pair2);

                await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(pair2);

                await pair1Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(pair2);


                expect(balance1).to.be.equal(0)
                expect(balance2).to.be.equal(0)

                expect(balance1_1).to.be.equal(0)
                expect(balance2_1).to.be.equal(amount)

                expect(balance1_2).to.be.equal(amount)
                expect(balance2_2).to.be.equal(amount)

            });

            it("Both reserve should be updated as required", async function () {

                const { mockMailbox, pair1Contract, pair2Contract, owner } = await loadFixture(deploy);

                await pair2Contract.addLiquidity(amount, amount2, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                await pair1Contract.addLiquidity(amount2, amount, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                expect(await pair1Contract.reserve1()).to.be.equal(amount2)

                expect(await pair1Contract.reserve2()).to.be.equal(amount)

                expect(await pair1Contract.kValue()).to.be.equal(BigInt(amount as any) * BigInt(amount2 as any))

                expect(await pair2Contract.reserve1()).to.be.equal(amount)

                expect(await pair2Contract.reserve2()).to.be.equal(amount2)

                expect(await pair2Contract.kValue()).to.be.equal(BigInt(amount as any) * BigInt(amount2 as any))

            });

        })

    })


    describe("Swaping Assets", function () {

        describe("Validations", function () {

            it("Balances should update with right details during Swap from pair One", async function () {

                const { mockMailbox, pair1, pair2, pair1Contract, owner } = await loadFixture(addLiquidity);

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(pair2);

                const amountIn = ethers.utils.parseUnits("2", "ether");
                const gas = ethers.utils.parseUnits("2.1", "ether");

                await pair1Contract.swap(amountIn, 1000, owner.address, { value: gas})

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(pair2);

                mockMailbox.processNextInboundMessage()

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(pair2);


                expect(balance1_1).to.be.greaterThan(balance1)
                expect(balance2_1).to.be.equal(balance2)
                expect(balance1_2).to.be.greaterThan(balance1)
                expect(balance2_2).to.be.lessThan(balance2)

            });


            it("Balances should update with right details during Swap from pair Two", async function () {

                const { pair1, pair2, pair2Contract, one, mockMailbox } = await loadFixture(addLiquidity);

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(pair2);

                const amountIn = ethers.utils.parseUnits("1", "ether");
                const gas = ethers.utils.parseUnits("1.1", "ether");

                await pair2Contract.swap(amountIn, amountIn, one.address, { value: gas})

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(pair2);

                mockMailbox.processNextInboundMessage()

                const balance1_2 = await ethers.provider.getBalance(pair1);
                const balance2_2 = await ethers.provider.getBalance(pair2);


                // console.log({ balance1, balance2 })

                // console.log({ balance1_1, balance2_1 })

                // console.log({ balance1_2, balance2_2 })

                // console.log({pair1, pair2})

                // console.log(await pair1Contract.remoteAddress())

                // console.log(await pair2Contract.remoteAddress())

                console.log(await pair2Contract.reserve1())

                console.log(await pair2Contract.reserve2())




                expect(balance1_1).to.be.equal(balance1)
                expect(balance2_1).to.be.greaterThan(balance2)
                //expect(balance1_2).to.be.lessThan(balance1)
                expect(balance2_2).to.be.greaterThan(balance2)

            });



            it("Fees should be paid on token swap", async function () {

                const { mockMailbox, pair2Contract, pair1Contract, owner, one, two, three, four } = await loadFixture(addLiquidity);

                const amount_1 = ethers.utils.parseUnits("50", "ether");
                const amount2_1 = ethers.utils.parseUnits("10", "ether");

                const amount_2 = ethers.utils.parseUnits("25", "ether");
                const amount2_2 = ethers.utils.parseUnits("5", "ether");

                const amount_3 = ethers.utils.parseUnits("10", "ether");
                const amount2_3 = ethers.utils.parseUnits("2", "ether");

                const amount_4 = ethers.utils.parseUnits("5", "ether");
                const amount2_4 = ethers.utils.parseUnits("1", "ether");

                //------1--------
                await pair2Contract.addLiquidity(amount_1, amount2_1, gasAmount, one.address, { value: gas})
        
                mockMailbox.processNextInboundMessage()
        
                await pair1Contract.addLiquidity(amount2_1, amount_1, gasAmount, one.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                //------2--------
                await pair2Contract.addLiquidity(amount_2, amount2_2, gasAmount, two.address, { value: gas})
        
                mockMailbox.processNextInboundMessage()
        
                await pair1Contract.addLiquidity(amount2_2, amount_2, gasAmount, two.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()
        
                //------3--------
                await pair2Contract.addLiquidity(amount_3, amount2_3, gasAmount, three.address, { value: gas})
        
                mockMailbox.processNextInboundMessage()
        
                await pair1Contract.addLiquidity(amount2_3, amount_3, gasAmount, three.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()
                //------END--------
                    
                //------4--------
                await pair2Contract.addLiquidity(amount_4, amount2_4, gasAmount, four.address, { value: gas})
        
                mockMailbox.processNextInboundMessage()
        
                await pair1Contract.addLiquidity(amount2_4, amount_4, gasAmount, four.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()
                //------END--------
                
                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await pair1Contract.swap(amountIn, 1000, owner.address, { value: _gas})

                mockMailbox.processNextInboundMessage()

                const total = BigInt(amount as any) + BigInt(amount_1 as any) + BigInt(amount_2 as any) + BigInt(amount_3 as any) + BigInt(amount_4 as any)

    
                console.log(total)

                //console.log(BigInt(amount as any).plus() )
                //expect(await pair1Contract.positions(1)).to.be.equal(BigInt(amount as any) * BigInt(5) * BigInt(amountIn as any) * / total)

                // console.log(await pair1Contract.positions(2))

                // console.log(await pair1Contract.positions(3))

                // console.log(await pair1Contract.positions(4))

                // console.log(await pair1Contract.positions(5))

            });



            it("Owner Can withdraw fee after swap", async function () {

                const { mockMailbox, pair1, pair1Contract, owner, one, two, three, four } = await loadFixture(addLiquidity);
                
                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(one.address);

                await pair1Contract.swap(amountIn, 1000, one.address, { value: _gas})

                mockMailbox.processNextInboundMessage()

                const balance1_1 = await ethers.provider.getBalance(pair1);
                const balance2_1 = await ethers.provider.getBalance(one.address);

                await pair1Contract.collectFee(1)

                console.log(await pair1Contract.positions(1))


            });

        })


        describe("Liquidity Provider", function () {


            it("Get all opened from a Liquidity Provider", async function () {

                const { mockMailbox, pair1Contract, pair2Contract, owner, one} = await loadFixture(addLiquidity);

                const amount_1 = ethers.utils.parseUnits("50", "ether");
                const amount2_1 = ethers.utils.parseUnits("10", "ether");
                await pair2Contract.addLiquidity(amount_1, amount2_1, gasAmount, owner.address, { value: gas})
                mockMailbox.processNextInboundMessage()
                await pair1Contract.addLiquidity(amount2_1, amount_1, gasAmount, owner.address, { value: gas})
                mockMailbox.processNextInboundMessage()

                const positions = await pair1Contract.getOpenedPositionsByAddress(owner.address)

                expect(positions.length).to.be.equal(2)

                expect(positions[0].amountIn1).to.be.equal(amount2)
                expect(positions[0].amountIn2).to.be.equal(amount)

                expect(positions[1].amountIn1).to.be.equal(amount2_1)
                expect(positions[1].amountIn2).to.be.equal(amount_1)

            });

            it("Liquidity Provider Can withdraw fees after swap", async function () {

                const { mockMailbox, pair1, pair1Contract, owner} = await loadFixture(addLiquidity);
                
                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await pair1Contract.swap(amountIn, 1000, owner.address, { value: _gas})

                mockMailbox.processNextInboundMessage()

                const position = await pair1Contract.positions(1)

                const balance1 = await ethers.provider.getBalance(pair1);
                const balance2 = await ethers.provider.getBalance(owner.address);

                await pair1Contract.collectFee(1)

                expect((await pair1Contract.positions(1)).availableFees).to.be.lessThan(position.availableFees)
                expect((await pair1Contract.positions(1)).totalFees).to.be.equal(position.totalFees)

                expect(await ethers.provider.getBalance(pair1)).to.be.equal(BigInt(balance1 as any) - BigInt(position.availableFees as any))
                expect(await ethers.provider.getBalance(owner.address)).to.be.greaterThan(balance2)

            });


            it("Cannot collect fees, if you are not the Liquidity Provider", async function () {

                const { mockMailbox, pair1Contract, owner, one} = await loadFixture(addLiquidity);
                
                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await pair1Contract.swap(amountIn, 1000, owner.address, { value: _gas})

                mockMailbox.processNextInboundMessage()

                await expect(pair1Contract.connect(one).collectFee(1)).to.be.revertedWith("MDEX: NOT OWNER")

            });

            it("Get All Open Position in an address", async function () {

                const { mockMailbox, pair1Contract, owner, one} = await loadFixture(addLiquidity);
                
                const amountIn = ethers.utils.parseUnits("2", "ether");
                const _gas = ethers.utils.parseUnits("2.1", "ether");

                await pair1Contract.swap(amountIn, 1000, owner.address, { value: _gas})

                mockMailbox.processNextInboundMessage()

                await expect(pair1Contract.connect(one).collectFee(1)).to.be.revertedWith("MDEX: NOT OWNER")

            });

        })

    });

});