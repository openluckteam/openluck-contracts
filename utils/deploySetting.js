const { randomBytes } = require("ethers/lib/utils");
const { getEndpointId, isNetworkAllowTaskForTest } = require("./network")
const CONFIG = require("../constants/config.json")
const CHAINLINK = require("../constants/chainLink.json")
const ACCEPTTOKEN = require("../constants/acceptTokens.json");

function getSettings(chainId, deployer, ethers) {

    let AddressZero = ethers.constants.AddressZero;

    const multiSigAddress = CONFIG.MultiSig[hre.network.name];
    chainLinkConfig = CHAINLINK[hre.network.name];

    let setting = {

        testing: true,
        multisigAddress: multiSigAddress? multiSigAddress: deployer,

        chainLink_vrfId: chainLinkConfig? chainLinkConfig.vrfId: 0,
        chainLink_linkToken: chainLinkConfig? chainLinkConfig.linkToken: AddressZero,
        chainLink_vrfCoordinator: chainLinkConfig? chainLinkConfig.vrfCoordinator: AddressZero,
        chainLink_linkKeyHash:  chainLinkConfig? chainLinkConfig.linkKeyHash: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
        chainLink_keeper: chainLinkConfig? chainLinkConfig.keeper: AddressZero,

        acceptTokens: [AddressZero],
        
        WETH: AddressZero,

        lzChainId: getEndpointId(),
        isAllowTask: isNetworkAllowTaskForTest(),
        AddressZero: AddressZero,
        
        deployedAddress: {
            LucksExecutor: AddressZero
        }
    }

    switch (chainId) {
        // eth mainnet
        case "1":
            setting.isAllowTask = false;
            break;
        // eth rinkeby
        case "4":
            setting.isAllowTask = false;
            break;
        // bsc
        case "56":
            setting.testing = false;           
            setting.acceptTokens = Object.values(ACCEPTTOKEN[hre.network.name]); 
            setting.WETH = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
            break;
        // bscTestnet
        case "97":
            break;
        // polygon
        case "137":
            setting.testing = false;           
            setting.acceptTokens = Object.values(ACCEPTTOKEN[hre.network.name]); 
            setting.WETH = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
            break;
        // matic-testnet
        case "80001":
            break;
        // Avalanche mainnet
        case "43114":
            break;
        // Avalanche Fuji
        case "43113":
            break;
        case '31337':  // hardhat / localhost        
        case "4337": // Local Ganache
        default:

            break;
    }

    return setting;
}

module.exports = {
    getSettings
}