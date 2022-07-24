require("./scripts/tasks");
require('dotenv').config();
require('@nomiclabs/hardhat-waffle');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
if (process.env.REPORT_GAS) {
  require('hardhat-gas-reporter');
}

const { PRIVATE_KEY, API_KEY, INFURA_KEY } = process.env;
module.exports = {
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 20000000000
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 20000000000
    },
  },
  etherscan: {
    apiKey: {
      mainnet: API_KEY,
      rinkeby: API_KEY
    }
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21
  }
};
