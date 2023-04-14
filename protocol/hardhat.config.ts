import { HardhatUserConfig } from "hardhat/config";
import 'hardhat-abi-exporter';
import 'hardhat-contract-sizer';
import "@nomicfoundation/hardhat-toolbox";

const config = {
  solidity: "0.8.19",
  settings: {
		optimizer: { enabled: true, runs: 200 }
	},
  abiExporter: [
		{
			path: '../frontend/src/abi',
			pretty: false,
			runOnCompile: true
		}
	],
	contractSizer: {
		alphaSort: true,
		disambiguatePaths: false,
		runOnCompile: true,
		strict: true,
		only: []
	}
};

export default config;
