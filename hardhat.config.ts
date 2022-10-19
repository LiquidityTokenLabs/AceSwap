import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import 'solidity-coverage';

const config: HardhatUserConfig = {
  solidity: '0.8.16',
  gasReporter: {
    enabled: true,
  },
};

export default config;
