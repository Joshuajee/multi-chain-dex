import { ethers } from "hardhat";


async function main() {

  const DOMAIN = 80001
  const MAILBOX = "0xCC737a94FecaeC165AbCf12dED095BB13F037685"
  const interchainGasPaymaster = "0xF90cB82a76492614D07B82a7658917f3aC811Ac1"

  const MDexV1CloneFactory = await ethers.getContractFactory("MDexV1CloneFactory");

  const mDexV1CloneFactory  = await MDexV1CloneFactory.deploy();

  const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");

  const mDexV1NativeFactory = await MDexV1NativeFactory.deploy(DOMAIN, mDexV1CloneFactory.address);

  await mDexV1NativeFactory.initialize(MAILBOX, interchainGasPaymaster)

  console.log("Factory: ", mDexV1CloneFactory.address)
  console.log("Contract: ", mDexV1NativeFactory.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
