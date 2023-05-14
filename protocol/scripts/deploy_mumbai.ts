import { ethers } from "hardhat";


async function main() {

  const DOMAIN = 80001
  const MAILBOX = "0xCC737a94FecaeC165AbCf12dED095BB13F037685"
  const interchainGasPaymaster = "0xF90cB82a76492614D07B82a7658917f3aC811Ac1"

  const MDexV1PairClone = await ethers.getContractFactory("MDexV1PairNative");

  const mDexV1PairClone  = await MDexV1PairClone.deploy();

  console.log("Clone: ", mDexV1PairClone.address)

  const MDexV1NativeFactory = await ethers.getContractFactory("MDexV1NativeFactory");

  const mDexV1NativeFactory = await MDexV1NativeFactory.deploy(DOMAIN, mDexV1PairClone.address);

  await mDexV1NativeFactory.initialize(MAILBOX, interchainGasPaymaster)

  console.log("Contract: ", mDexV1NativeFactory.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
