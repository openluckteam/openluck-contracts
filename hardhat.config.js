const dotenv = require('dotenv');
// require("@tenderly/hardhat-tenderly");
require("@nomiclabs/hardhat-ganache");
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('solidity-coverage');
require("hardhat-tracer");
require('hardhat-contract-sizer');


dotenv.config();

const defaultNetwork = 'localhost';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function privatekeys(network) {
  network = network || defaultNetwork;
  let accounts = [
    process.env.LOCAL_DEPLOYER_PRIVATE_KEY,
    process.env.LOCAL_CALLER_PRIVATE_KEY,
    process.env.LOCAL_JOINER_PRIVATE_KEY,
    process.env.LOCAL_JOINER2_PRIVATE_KEY
  ];
  switch (network) {
    case "eth":
    case "bsc":
    case "polygon":
    case "avalanche":
      accounts = [
        process.env.DEPLOYER_PRIVATE_KEY, 
        process.env.CALLER_PRIVATE_KEY, 
        process.env.JOINER_PRIVATE_KEY,
        process.env.JOINER2_PRIVATE_KEY];
      break;
    case "rinkeby":
    case "bscTestnet":
    case "mumbai-testnet":
    case "avalancheFujiTestnet":
      accounts = [
        process.env.TEST_DEPLOYER_PRIVATE_KEY, 
        process.env.TEST_CALLER_PRIVATE_KEY, 
        process.env.TEST_JOINER_PRIVATE_KEY, 
        process.env.TEST_JOINER2_PRIVATE_KEY];
      break;
    default:
      break;
  }
  return accounts;
}

// custom helper tasks
require("./tasks/lzEndpointMock");
require("./tasks/wireBridges");
require("./tasks/checkSettings");
require("./tasks/multiSig");
require("./tasks/setTrustedRemote");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            // runs: 999999,
          },
        },
      },
      {
        version: '0.8.2',
        settings: {
          optimizer: {
            enabled: true,
            runs: 20000,
          },
        },
      },
      {
        version: '0.7.5',
        settings: {
          "optimizer": {
            "enabled": true,
            "runs": 1337
          },
          "outputSelection": {
            "*": {
              "*": [
                "evm.bytecode",
                "evm.deployedBytecode",
                "abi"
              ]
            }
          },
          "metadata": {
            "useLiteralContent": true
          },
          "libraries": {}
        },
      },     
      {
        version: '0.6.8',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: '0.6.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: '0.4.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      }
    ],   
  },
  defaultNetwork,
  networks: {
    "localhost-eth": {
      url: 'http://127.0.0.1:8545',
      gasPrice: 500000000, // 5Gwei
      timeout: 600000,
      network_id: '*'
    },
    "localhost-bsc": {
      url: 'http://127.0.0.1:8545',
      gasPrice: 500000000, // 5Gwei
      timeout: 600000,
      network_id: '*'
    },
    // eth network
    "eth": {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: privatekeys("eth"),
      gasPrice: 50000000000, //50Gwei
      network_id: 1,
      timeout: 600000,
    },
    "rinkeby-testnet": {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: privatekeys("rinkeby"),
      network_id: 4,
      gasPrice: 5000000000, //3Gwei
      gas: 10000000,
      timeout: 600000,
    },
    // bsc network
    "bsc": {
      url: 'https://bsc-dataseed1.binance.org',
      accounts: privatekeys("bsc"),
      gasPrice: 5000000000, //5Gwei
      network_id: 56,
      timeout: 600000,
    },
    "bsctestnet-testnet": {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: privatekeys("bscTestnet"),
      network_id: 97,
      gasPrice: 11000000000, //11Gwei
      gas: 8000000,
      timeout: 600000,
    },
    // polygon network
    "polygon": {
      url: 'https://polygon-rpc.com',
      accounts: privatekeys("polygon"),
      network_id: 137,
      gasPrice: 60000000000, //60Gwei
      gas: 8000000,
      timeout: 600000,
    },
    "mumbai-testnet": {
      // url: 'https://rpc-mumbai.maticvigil.com',
      url: 'https://polygon-mumbai.g.alchemy.com/v2/iFDCa7veBgsL-PVpGx8N7ppUgosCGIJP',
      accounts: privatekeys("mumbai-testnet"),
      network_id: 80001,
      gasPrice: 35000000000, //35Gwei
      gas: 8000000,
      timeout: 600000,
    },
    // avalanche network
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      accounts: privatekeys("avalanche"),
      network_id: 43114
    },
    "fuji-testnet": {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: privatekeys("avalancheFujiTestnet"),
      network_id: 43113,
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    caller: {
      default: 1,
    },
    joiner: {
      default: 2,
    },
    joiner2: {
      default: 3,
    }
  },
  mocha: {
    bail: true,
    allowUncaught: true,
    timeout: 43200000 // 12hours
  },
  gasReporter: {
    currency: 'BNB',
    gasPrice: 5, // GWei
    enabled: !!process.env.REPORT_GAS,
    showTimeSpent: true
  },
  etherscan: {
    apiKey: process.env.SCAN_API_KEY,
    verify_axiosDefaultConfig: {
      proxy: true,
      httpsAgentUrl: "http://127.0.0.1:41091"
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  tenderly: {
    username: "ToniDoge",
    project: "openluck"
  }
};
