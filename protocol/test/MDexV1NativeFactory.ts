import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("MDexV1NativeFactory",  function () {
    
    const originDomain = 1000
    const remoteDomain = 2000

    const amount1 = ethers.utils.parseUnits("100", "ether");
    const amount2 = ethers.utils.parseUnits("20", "ether");
    const gas = ethers.utils.parseUnits("101", "ether");

    async function deploy() {

        const MockSignature = await ethers.getContractFactory("MockSignature");
        const mockSignature = await MockSignature.deploy()

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();

        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");

        const MDexV1CloneFactory = await ethers.getContractFactory("MDexV1CloneFactory");

        const mDexV1CloneFactory  = await MDexV1CloneFactory.connect(owner).deploy();
        const mDexV1CloneFactory2  = await MDexV1CloneFactory.connect(owner).deploy();

        const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(originDomain, mDexV1CloneFactory.address);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.connect(owner).deploy(remoteDomain, mDexV1CloneFactory2.address);

        // MailBox
        const MockMailbox = await ethers.getContractFactory("MockMailbox");

        const mockMailbox = await MockMailbox.connect(owner).deploy(originDomain);
        const mockMailbox2 = await MockMailbox.connect(owner).deploy(remoteDomain);

        // adding remote
        await mockMailbox.addRemoteMailbox(originDomain, mockMailbox.address);
        await mockMailbox.addRemoteMailbox(remoteDomain, mockMailbox2.address);

        await mockMailbox2.addRemoteMailbox(originDomain, mockMailbox.address);
        await mockMailbox2.addRemoteMailbox(remoteDomain, mockMailbox2.address);
        // End Mailbox

        //InterchainGasMaster
        const MIGP = await ethers.getContractFactory("MockInterchainGasPaymaster");

        const interchainGasPaymaster1 = await MIGP.connect(owner).deploy();
        const interchainGasPaymaster2 = await MIGP.connect(owner).deploy();

        await interchainGasPaymaster1.setExchangeRate(remoteDomain, 1)
        await interchainGasPaymaster1.setExchangeRate(originDomain, 5)
        //End InterchainGasMaster

        return { MockMailbox, mockSignature, mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }



    async function initialize() {

        const { mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, mockSignature, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four} = await deploy()

        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address)

        await mDexV1NativeFactory2.initialize(mockSignature.address, interchainGasPaymaster2.address)

        return { mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, mockSignature, owner, one, two, three, four};
    }

    describe("Deployment", function () {

        it("Domain Should be set correctly", async function () {
            const [owner] = await ethers.getSigners();
            const MDexV1CloneFactory = await ethers.getContractFactory("MDexV1CloneFactory");
            const mDexV1CloneFactory  = await MDexV1CloneFactory.connect(owner).deploy();
            const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
            const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(1, mDexV1CloneFactory.address);
            expect(await mDexV1NativeFactory.LOCAL_DOMAIN()).to.be.equal(1)
        });

        it("Pair length should be zero", async function () {
            const { mDexV1NativeFactory } = await loadFixture(deploy);
            expect(await mDexV1NativeFactory.allPairsLength()).to.equal(0);
        });

        it("Should initialize with the right Info", async function () {
            const { mDexV1NativeFactory, owner, MockMailbox, mockMailbox } = await loadFixture(deploy);

            const interchainGasPaymaster = await MockMailbox.connect(owner).deploy(1000);

            await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster.address)
    
            expect(await mDexV1NativeFactory.mailbox()).to.be.equal(mockMailbox.address)

            expect(await mDexV1NativeFactory.interchainGasPaymaster()).to.be.equal(interchainGasPaymaster.address)

        });

    });

    describe("Pair Creation", function () {

        describe("Validations", function () {

            it("Should revert if Factory has not been initialize", async function () {
                const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(deploy);

                //await expect(mDexV1NativeFactory.createPair(remoteDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })).to.be.revertedWith("!contract")
                
            });

            it("Should revert with the right error if the chains are the same", async function () {
                const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(initialize);

                await expect(mDexV1NativeFactory.createPair(originDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })).to.be.revertedWith(
                    "MDEX: IDENTICAL_CHAIN"
                );
                
            });

            it("Should create pair with right details and balance", async function () {
                const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(initialize);

                await mDexV1NativeFactory.createPair(remoteDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })

                const address = await mDexV1NativeFactory.allPairs(0)

                const balance = await ethers.provider.getBalance(address);

                expect(await mDexV1NativeFactory.allPairsLength()).to.be.equal(1)

                expect(await mDexV1NativeFactory.allPairs(0)).to.be.equal(address)

                expect(await mDexV1NativeFactory.getPair(originDomain, remoteDomain)).to.be.equal(address)

                expect(balance).to.be.equal(amount1)
                
            });

            // it("Should update pair contract balance and reserve", async function () {
            //     const { mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox } = await loadFixture(initialize);

            //     await mDexV1NativeFactory.createPair(remoteDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })

            //     const address = await mDexV1NativeFactory.allPairs(0)

            //     const balance = await ethers.provider.getBalance(address);

            //     mockMailbox.processNextInboundMessage()

            //     const pair1Contract = await ethers.getContractAt("MDexV1PairNative", address);

            //     expect(balance).to.be.equal(amount1)


            //     console.log(await pair1Contract.reserve1())


            // });

            
        })


        describe("Events", function () {

            it("Should emit an event on pair creation", async function () {

                const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(initialize);

                const emit = await  mDexV1NativeFactory.createPair(remoteDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })
                
                expect(emit).to.emit(mDexV1NativeFactory, "PairCreated")
                    .withArgs(originDomain, remoteDomain, await mDexV1NativeFactory.allPairs(0), 1); 

            });

        })

    });


    // describe("Handle Message function", function () {

    //     describe("Validations", function () {

    //         it("Should revert if not called by MockMailbox contract", async function () {

    //             const { mDexV1NativeFactory, owner, mockSignature } = await loadFixture(initialize);

    //             await expect(mDexV1NativeFactory.connect(owner).handle(
    //                 originDomain, 
    //                 "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266", 
    //                 mockSignature.encodeCreatePairReceiver(originDomain, owner.address)
    //             )).to.be.revertedWith("!mailbox")
                
    //         });
            
    //     })


    //     describe("Events", function () {

    //         it("Should emit an event on pair creation", async function () {

    //             const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(initialize);

    //             const emit = await mDexV1NativeFactory.createPair(remoteDomain, amount1, amount2, 10, mDexV1NativeFactory2.address, { value: gas })
                
    //             expect(emit).to.emit(mDexV1NativeFactory, "PairCreated")
    //                 .withArgs(1, 190, await mDexV1NativeFactory.allPairs(0), 1); 

    //         });

    //     })

    // });

});
