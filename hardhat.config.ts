import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import 'solidity-coverage';

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  gasReporter: {
    enabled: false,
  },
};

export default config;
