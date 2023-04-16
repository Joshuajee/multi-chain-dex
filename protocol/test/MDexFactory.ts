import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("MDexFactory", function () {
    
    const originDomain = 1000
    const remoteDomain = 2000

    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();

        const MDexFactory = await ethers.getContractFactory("MDexFactory");
        const mDexFactory = await MDexFactory.connect(owner).deploy(originDomain);
        const mDexFactory2 = await MDexFactory.connect(owner).deploy(remoteDomain);

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

        return { MockMailbox, mDexFactory, mDexFactory2, mockMailbox, mockMailbox2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }



    async function initialize() {

        const { MockMailbox, mDexFactory, mDexFactory2, mockMailbox, mockMailbox2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four} = await deploy()

        // const MockMailbox = await ethers.getContractFactory("MockMailbox");
        const interchainSecurityModule = await MockMailbox.connect(owner).deploy(originDomain);
        
        await mDexFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address, interchainSecurityModule.address)

        await mDexFactory2.initialize(mockMailbox2.address, interchainGasPaymaster2.address, interchainSecurityModule.address)

        return { mDexFactory, mDexFactory2, mockMailbox, mockMailbox2, owner, one, two, three, four};
    }

    describe("Deployment", function () {

        it("Domain Should be set correctly", async function () {
            const [owner] = await ethers.getSigners();
            const MDexFactory = await ethers.getContractFactory("MDexFactory");
            const mDexFactory = await MDexFactory.connect(owner).deploy(1);
            expect(await mDexFactory.LOCAL_DOMAIN()).to.be.equal(1)
        });

        it("Pair length should be zero", async function () {
            const { mDexFactory } = await loadFixture(deploy);
            expect(await mDexFactory.allPairsLength()).to.equal(0);
        });

        it("Should initialize with the right Info", async function () {
            const { mDexFactory, owner, MockMailbox, mockMailbox } = await loadFixture(deploy);

            // const MockMailbox = await ethers.getContractFactory("MockMailbox");
            const interchainGasPaymaster = await MockMailbox.connect(owner).deploy(1000);

            // const MockMailbox = await ethers.getContractFactory("MockMailbox");
            const interchainSecurityModule = await MockMailbox.connect(owner).deploy(1000);
            
            await mDexFactory.initialize(mockMailbox.address, interchainGasPaymaster.address, interchainSecurityModule.address)
    
            expect(await mDexFactory.mailbox()).to.be.equal(mockMailbox.address)

            expect(await mDexFactory.interchainGasPaymaster()).to.be.equal(interchainGasPaymaster.address)

            expect(await mDexFactory.interchainSecurityModule()).to.be.equal(interchainSecurityModule.address)

        });

    });

    describe("Pair Creation", function () {

        describe("Validations", function () {

            it("Should revert if Factory has not been initialize", async function () {
                const { mDexFactory, owner } = await loadFixture(deploy);

                const MockMailbox = await ethers.getContractFactory("MockMailbox");
                const mockMailbox = await MockMailbox.connect(owner).deploy(1000);

                await expect(mDexFactory.createPair(remoteDomain, 100, mockMailbox.address, { value: 100000})).to.be.revertedWith("!contract")
                
            });

            it("Should revert with the right error if the chains are the same", async function () {
                const { mDexFactory, mockMailbox } = await loadFixture(initialize);

                await expect(mDexFactory.createPair(originDomain, 100, mockMailbox.address, { value: 100000})).to.be.revertedWith(
                    "MDEX: IDENTICAL_CHAIN"
                );
                
            });

            it("Should create pair with right details", async function () {
                const { mDexFactory, mDexFactory2 } = await loadFixture(initialize);

                await mDexFactory.createPair(remoteDomain, 10, mDexFactory2.address, { value: 1000000000000000})

                const address = await mDexFactory.allPairs(0)

                expect(await mDexFactory.allPairsLength()).to.be.equal(1)

                // expect(await mDexFactory.allPairs(0)).to.be.equal(address)

                // expect(await mDexFactory.getPair(originDomain, remoteDomain)).to.be.equal(address)

                
            });
            
        })


        describe("Events", function () {

            it("Should emit an event on pair creation", async function () {

                const { mDexFactory, mockMailbox } = await loadFixture(initialize);

                const emit = await mDexFactory.createPair(remoteDomain, 100000, mockMailbox.address, { value: 100000})
                
                expect(emit).to.emit(mDexFactory, "PairCreated")
                    .withArgs(originDomain, remoteDomain, await mDexFactory.allPairs(0), 1); 

            });

        })

    });


    describe("Handle Message function", function () {

        describe("Validations", function () {

            it("Should revert if not called by MockMailbox contract", async function () {

                const { mDexFactory, owner } = await loadFixture(initialize);

                await expect(mDexFactory.connect(owner).handle(
                    originDomain, 
                    "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266", 
                    "0x514de2d100000000000000000000000000000000000000000000000000000000000003e86d796c6f7665000000000000000000000000000000000000000000000000000000000000000000000000000069d4d4600f7db2d8595827bd6fbe81888f0a06dc"
                )).to.be.revertedWith("!mailbox")
                
            });

            it("Should create new pair on remote chain", async function () {
                
                const { mDexFactory,  mDexFactory2, mockMailbox, mockMailbox2 } = await loadFixture(initialize);
            
                await mockMailbox.dispatch(
                    remoteDomain, 
                    mockMailbox.addressToBytes32(mDexFactory2.address), 
                    '0xe17ab01000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df'
                )

                await mockMailbox2.processNextInboundMessage()

                // expect(await mDexFactory2.allPairsLength()).to.be.equal(1)

                // const address = await mDexFactory.allPairs(0)

                // expect(await mDexFactory.allPairs(0)).to.be.equal(address)

                // expect(await mDexFactory.getPair(originDomain, remoteDomain)).to.be.equal(address)

    
            });
            
        })


        describe("Events", function () {

            // it("Should emit an event on pair creation", async function () {

            //     const { mDexFactory, mockMailbox } = await loadFixture(initialize);

            //     const emit = await mDexFactory.createPair(remoteDomain, 100000, mockMailbox.address, { value: 100000})
                
            //     expect(emit).to.emit(mDexFactory, "PairCreated")
            //         .withArgs(1, 190, await mDexFactory.allPairs(0), 1); 

            // });

        })

    });


});
