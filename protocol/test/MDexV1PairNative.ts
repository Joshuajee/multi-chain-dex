import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MDexV1NativeFactory, MDexV1PairNative, MockMailbox  } from "../typechain-types";


describe("Testing the liquidity pools", function () {
    
    const originDomain = 1000
    const remoteDomain = 2000

    const ADDRESS_1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    const ADDRESS_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    const ADDRESS_3 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    const ADDRESS_4 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    const ADDRESS_5 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

    const CREATE_PAIR = '0xe17ab01000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df';

    const ADD_LIQUIDITY = '0xe17ab01000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df000000000000000000000000da07165d4f7c84eeefa7a4ff439e039b7925d3df';

    async function mailbox(mDexV1NativeFactory: MDexV1NativeFactory, mockMailbox: MockMailbox, mockMailbox2: MockMailbox, domain: number) {

        await mockMailbox.dispatch(
            domain, 
            mockMailbox.addressToBytes32(mDexV1NativeFactory.address), 
            CREATE_PAIR
        )

        await mockMailbox2.processNextInboundMessage()

        return await mDexV1NativeFactory.allPairs(0)
        
    }

    async function mailboxPair(address: string, mockMailbox: MockMailbox, domain: number, message: string) {

        await mockMailbox.dispatch(
            domain, 
            mockMailbox.addressToBytes32(address), 
            message
        )

        await mockMailbox.processNextInboundMessage()
        
    }

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

        const interchainSecurityModule = await MockMailbox.connect(owner).deploy(originDomain);
        
        await mDexV1NativeFactory.initialize(mockMailbox.address, interchainGasPaymaster1.address, interchainSecurityModule.address)

        await mDexV1NativeFactory2.initialize(mockMailbox2.address, interchainGasPaymaster2.address, interchainSecurityModule.address)

        const pair1 = await mailbox(mDexV1NativeFactory2, mockMailbox, mockMailbox2, remoteDomain);

        const pair2 = await mailbox(mDexV1NativeFactory, mockMailbox2, mockMailbox, originDomain);

        return { pair1, pair2, interchainGasPaymaster1, interchainGasPaymaster2, owner, one, two, three, four};
    }




    describe("Adding Liquidity", function () {

        describe("Validations", function () {

            it("Should add Liquidity on pending state on both chains", async function () {

                const { pair1, pair2 } = await loadFixture(deploy);

                console.log({ pair1, pair2 } )




                
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

