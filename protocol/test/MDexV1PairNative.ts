import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MDexV1NativeFactory,  MockMailbox  } from "../typechain-types";


describe("Testing the liquidity pools", async function () {

    const originDomain = 1000
    const remoteDomain = 2000

    const ADDRESS_1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    const ADDRESS_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    const ADDRESS_3 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    const ADDRESS_4 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    const ADDRESS_5 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

    const CREATE_PAIR = "0xeb82818700000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000000002af8000000000000000000000000d2a5bc10698fd955d1fe6cb468a17809a08fd005";

    const ADD_LIQUIDITY = "0xf4b1f3c40f90a0488ce7696afa9c960f9eed40315673aa6e7bf9c43b0b9933bedab7b5b800000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    const amount = ethers.utils.parseUnits("100", "ether");
    const gas = ethers.utils.parseUnits("101", "ether");
    const gasAmount = ethers.utils.parseUnits("0.01", "ether");

    const kValue = ethers.utils.parseUnits("0.001", "ether");

    // MailBox
    const MockMailbox = await ethers.getContractFactory("MockMailbox");

    const mockMailbox = await MockMailbox.deploy(originDomain);
    const mockMailbox2 = await MockMailbox.deploy(remoteDomain);

    // adding remote
    await mockMailbox.addRemoteMailbox(originDomain, mockMailbox.address);
    await mockMailbox.addRemoteMailbox(remoteDomain, mockMailbox.address);

    const MockSignature = await ethers.getContractFactory("MockSignature");

    const mockSignature = await MockSignature.deploy()


    // async function mockMailbox(address: string, domain: number, message: string) {

    //     await mockMailbox.dispatch(
    //         domain,
    //         mockMailbox.addressToBytes32(address),
    //         message
    //     )

    //     await mockMailbox.processNextInboundMessage()

    // }



    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();

        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
        const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(originDomain);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.connect(owner).deploy(remoteDomain);

        // End Mailbox

        //InterchainGasMaster
        const MIGP = await ethers.getContractFactory("MockInterchainGasPaymaster");

        const interchainGasPaymaster1 = await MIGP.connect(owner).deploy();
        const interchainGasPaymaster2 = await MIGP.connect(owner).deploy();

        await interchainGasPaymaster1.setExchangeRate(remoteDomain, 1)
        await interchainGasPaymaster1.setExchangeRate(originDomain, 5)
        //End InterchainGasMaster

        const interchainSecurityModule = await MockMailbox.connect(owner).deploy(originDomain);

        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address, interchainSecurityModule.address)

        await mDexV1NativeFactory2.initialize(mockMailbox.address, interchainGasPaymaster2.address, interchainSecurityModule.address)

        await mDexV1NativeFactory.createPair(remoteDomain, kValue, 100, mDexV1NativeFactory2.address, { value: 100000})

        await mockMailbox.processNextInboundMessage()

        const pair1 = await mDexV1NativeFactory.allPairs(0)

        const pair2 = await mDexV1NativeFactory2.allPairs(0)

        const pair1Contract = await ethers.getContractAt("MDexV1PairNative", pair1);

        const pair2Contract = await ethers.getContractAt("MDexV1PairNative", pair2);

        return { mDexV1NativeFactory, mDexV1NativeFactory2, pair1, pair2, pair1Contract, pair2Contract, mockMailbox, mockMailbox2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
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

            expect(await pair1Contract.kValue()).to.be.equal(kValue)

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

            expect(await pair2Contract.kValue()).to.be.equal(kValue)


        });

    })




    describe("Adding Liquidity", function () {

        describe("Validations", function () {

            it("Should add Liquidity to both contracts", async function () {

                const { owner, pair1Contract, pair2Contract, mockMailbox } = await loadFixture(deploy);

                await pair2Contract.addLiquidity(amount, gasAmount, owner.address, { value: gas})
                
                mockMailbox.processNextInboundMessage()

                console.log(" --- ", pair1Contract.address, pair2Contract.address)

                //expect(await pair1Contract.positionCounter()).to.be.equal(1)

                expect(await pair2Contract.positionCounter()).to.be.equal(1)

            });


            it("Should add Liquidity to opened Positions, when Liquity is added after mailbox message", async function () {

                const { pair2, pair2Contract, mockMailbox, mockMailbox2 } = await loadFixture(deploy);

                // await mailboxPair(pair2, mockMailbox2, mockMailbox, originDomain, ADD_LIQUIDITY)

                // await pair2Contract.addLiquidity(amount, gasAmount, ADDRESS_1, { value: gas })

                //expect(await pair2Contract.positionCounter()).to.be.equal(1)

                //expect(await pair2Contract.openPositionArray(0)).to.be.equal(1)

            });

            it("Contract Balance should be increase to amount", async function () {

                const { pair1, pair1Contract, mockMailbox, mockMailbox2 } = await loadFixture(deploy);

                const balance = await ethers.provider.getBalance(pair1);

                // await mailboxPair(pair1, mockMailbox, mockMailbox2, remoteDomain, ADD_LIQUIDITY)

                // await pair1Contract.addLiquidity(amount, gasAmount, ADDRESS_1, { value: gas })

                // expect(balance).to.be.equal(0)

                // expect(await ethers.provider.getBalance(pair1)).to.be.equal(amount)

            });

            it("Both reserve should be updated", async function () {

                const { pair1, pair1Contract, mockMailbox, mockMailbox2 } = await loadFixture(deploy);

                // await mailboxPair(pair1, mockMailbox, mockMailbox2, remoteDomain, ADD_LIQUIDITY)

                // await pair1Contract.addLiquidity(amount, gasAmount, ADDRESS_1, { value: gas })

                // console.log(await pair1Contract.reserve1())

                // console.log(await pair1Contract.reserve2())

                // console.log(await pair1Contract.kValue())
                // expect(balance).to.be.equal(0)

                // expect(await ethers.provider.getBalance(pair1)).to.be.equal(amount)

            });

            it("Should not update Reserve when called by only mailbox", async function () {

                const { pair1, pair1Contract, mockMailbox, mockMailbox2 } = await loadFixture(deploy);

                //await mailboxPair(pair1, mockMailbox, mockMailbox2, remoteDomain, ADD_LIQUIDITY)

                // console.log(await pair1Contract.reserve1())

                // console.log(await pair1Contract.reserve2())

                // console.log(await pair1Contract.kValue())
                // expect(balance).to.be.equal(0)

                // expect(await ethers.provider.getBalance(pair1)).to.be.equal(amount)

            });



        })


        describe("Events", function () {

            it("Should emit an event on pair creation", async function () {


            });

        })

    });


    describe("Handle Message function", function () {

        describe("Validations", function () {



        })


        describe("Events", function () {

            // it("Should emit an event on pair creation", async function () {

            //     const { mDexV1NativeFactory, mockMailbox } = await loadFixture(initialize);

            //     const emit = await mDexV1NativeFactory.createPair(remoteDomain, 100000, mockMailbox.address, { value: 100000})

            //     expect(emit).to.emit(mDexV1NativeFactory, "PairCreated")
            //         .withArgs(1, 190, await mDexV1NativeFactory.allPairs(0), 1);

            // });

        })

    });


});

