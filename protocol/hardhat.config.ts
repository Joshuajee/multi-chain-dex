require('dotenv').config();
import 'hardhat-abi-exporter';
import 'hardhat-contract-sizer';
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";

const PRIVATE_KEY = String(process.env.PRIVATE_KEY);
const POLYGONSCAN_API_KEY = String(process.env.POLYGONSCAN_API_KEY);
const BSCSCAN_API_KEY = String(process.env.BSCSCAN_API_KEY);

const config = {
	solidity: "0.8.19",
	settings: {
		optimizer: { enabled: true, runs: 200 }
	},
	abiExporter: [
		{
			path: '../frontend/src/abi',
			pretty: false,
			runOnCompile: true,
			only: [":MDexV1"],
			flatted: true
		}
	],
	contractSizer: {
		alphaSort: true,
		disambiguatePaths: false,
		runOnCompile: true,
		strict: true,
		only: [":MDexV1"]
	},
	networks: {
		fuji: {
			url: 'https://api.avax-test.network/ext/C/rpc',
			accounts: [ PRIVATE_KEY ]
		},
		mumbai: {
			url: 'https://polygon-mumbai.g.alchemy.com/v2/1yHVzG9cEm8g0IJKQA0VO-nczdGW4NgO',
			accounts: [ PRIVATE_KEY ]
		},
		afijores: {
			url: 'https://alfajores-forno.celo-testnet.org',
			accounts: [ PRIVATE_KEY ]
		},
	},
	etherscan: {
		apiKey: {
			polygonMumbai: POLYGONSCAN_API_KEY,
			bscTestnet: BSCSCAN_API_KEY 
		}
	}
};

export default config;
