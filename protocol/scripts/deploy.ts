import { HyperlaneRouterDeployer, ChainName } from '@hyperlane-xyz/sdk';

class MyDeployer<Chain extends ChainName, MyConfig>
  extends HyperlaneRouterDeployer<Chain, MyContracts, MyFactories, MyConfig> { 
    
    function deployContracts(network: Networks, config: MyConfig) {
      // Custom contract deployment logic to goes here
      // This method is called once for each target chain
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
MyDeployer().deployContracts().catch((error: Error) => {
  console.error(error);
  process.exitCode = 1;
});
