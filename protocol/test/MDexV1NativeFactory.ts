import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("MDexV1NativeFactory", function () {
    
    const originDomain = 1000
    const remoteDomain = 2000

    async function deploy() {

        // Contracts are deployed using the first signer/account by default
        const [owner, one, two, three, four] = await ethers.getSigners();

        const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
        const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(originDomain);
        const mDexV1NativeFactory2 = await MDexV1NativeFactory.connect(owner).deploy(remoteDomain);

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

        return { MockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, mockMailbox2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }



    async function initialize() {

        const { MockMailbox, mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, mockMailbox2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four} = await deploy()

        // const MockMailbox = await ethers.getContractFactory("MockMailbox");
        const interchainSecurityModule = await MockMailbox.connect(owner).deploy(originDomain);
        
        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address, interchainSecurityModule.address)

        await mDexV1NativeFactory2.initialize(mockMailbox2.address, interchainGasPaymaster2.address, interchainSecurityModule.address)

        return { mDexV1NativeFactory, mDexV1NativeFactory2, mockMailbox, mockMailbox2, owner, one, two, three, four};
    }

    describe("Deployment", function () {

        it("Domain Should be set correctly", async function () {
            const [owner] = await ethers.getSigners();
            const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");
            const mDexV1NativeFactory = await MDexV1NativeFactory.connect(owner).deploy(1);
            expect(await mDexV1NativeFactory.LOCAL_DOMAIN()).to.be.equal(1)
        });

        it("Pair length should be zero", async function () {
            const { mDexV1NativeFactory } = await loadFixture(deploy);
            expect(await mDexV1NativeFactory.allPairsLength()).to.equal(0);
        });

        it("Should initialize with the right Info", async function () {
            const { mDexV1NativeFactory, owner, MockMailbox, mockMailbox } = await loadFixture(deploy);

            // const MockMailbox = await ethers.getContractFactory("MockMailbox");
            const interchainGasPaymaster = await MockMailbox.connect(owner).deploy(1000);

            // const MockMailbox = await ethers.getContractFactory("MockMailbox");
            const interchainSecurityModule = await MockMailbox.connect(owner).deploy(1000);
            
            await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster.address, interchainSecurityModule.address)
    
            expect(await mDexV1NativeFactory.mailbox()).to.be.equal(mockMailbox.address)

            expect(await mDexV1NativeFactory.interchainGasPaymaster()).to.be.equal(interchainGasPaymaster.address)

            expect(await mDexV1NativeFactory.interchainSecurityModule()).to.be.equal(interchainSecurityModule.address)

        });

    });

    describe("Pair Creation", function () {

        describe("Validations", function () {

            it("Should revert if Factory has not been initialize", async function () {
                const { mDexV1NativeFactory, owner } = await loadFixture(deploy);

                const MockMailbox = await ethers.getContractFactory("MockMailbox");
                const mockMailbox = await MockMailbox.connect(owner).deploy(1000);

                await expect(mDexV1NativeFactory.createPair(remoteDomain, 100, mockMailbox.address, { value: 100000})).to.be.revertedWith("!contract")
                
            });

            it("Should revert with the right error if the chains are the same", async function () {
                const { mDexV1NativeFactory, mockMailbox } = await loadFixture(initialize);

                await expect(mDexV1NativeFactory.createPair(originDomain, 100, mockMailbox.address, { value: 100000})).to.be.revertedWith(
                    "MDEX: IDENTICAL_CHAIN"
                );
                
            });

            it("Should create pair with right details", async function () {
                const { mDexV1NativeFactory, mDexV1NativeFactory2 } = await loadFixture(initialize);

                await mDexV1NativeFactory.createPair(remoteDomain, 10, mDexV1NativeFactory2.address, { value: 1000000000000000})

                const address = await mDexV1NativeFactory.allPairs(0)

                expect(await mDexV1NativeFactory.allPairsLength()).to.be.equal(1)

                expect(await mDexV1NativeFactory.allPairs(0)).to.be.equal(address)

                expect(await mDexV1NativeFactory.getPair(originDomain, remoteDomain)).to.be.equal(address)

                
            });
            
        })


        describe("Events", function () {

            it("Should emit an event on pair creation", async function () {

                const { mDexV1NativeFactory, mockMailbox } = await loadFixture(initialize);

                const emit = await mDexV1NativeFactory.createPair(remoteDomain, 100000, mockMailbox.address, { value: 100000})
                
                expect(emit).to.emit(mDexV1NativeFactory, "PairCreated")
                    .withArgs(originDomain, remoteDomain, await mDexV1NativeFactory.allPairs(0), 1); 

            });

        })

    });


    describe("Handle Message function", function () {

        describe("Validations", function () {

            it("Should revert if not called by MockMailbox contract", async function () {

                const { mDexV1NativeFactory, owner } = await loadFixture(initialize);

                await expect(mDexV1NativeFactory.connect(owner).handle(
                    originDomain, 
                    "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266", 
                    "0x514de2d100000000000000000000000000000000000000000000000000000000000003e86d796c6f7665000000000000000000000000000000000000000000000000000000000000000000000000000069d4d4600f7db2d8595827bd6fbe81888f0a06dc"
                )).to.be.revertedWith("!mailbox")
                
            });

            it("Should create new pair on remote chain", async function () {
                
                const { mDexV1NativeFactory2, mockMailbox, mockMailbox2 } = await loadFixture(initialize);
            
                await mockMailbox.dispatch(
                    remoteDomain, 
                    mockMailbox.addressToBytes32(mDexV1NativeFactory2.address), 
                    '0xe17ab01000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df'
                )

                await mockMailbox2.processNextInboundMessage()

                expect(await mDexV1NativeFactory2.allPairsLength()).to.be.equal(1)

                const address = await mDexV1NativeFactory2.allPairs(0)

                expect(await mDexV1NativeFactory2.allPairs(0)).to.be.equal(address)

                expect(await mDexV1NativeFactory2.getPair(originDomain, remoteDomain)).to.be.equal(address)

            });
            
        })


        describe("Events", function () {

            it("Should emit an event on pair creation", async function () {

                const { mDexV1NativeFactory, mockMailbox } = await loadFixture(initialize);

                const emit = await mDexV1NativeFactory.createPair(remoteDomain, 100000, mockMailbox.address, { value: 100000})
                
                expect(emit).to.emit(mDexV1NativeFactory, "PairCreated")
                    .withArgs(1, 190, await mDexV1NativeFactory.allPairs(0), 1); 

            });

        })

    });


});
