const { randomBytes } = require("ethers/lib/utils");
const { getEndpointId, isNetworkAllowTaskForTest } = require("./network")
const CONFIG = require("../constants/config.json")

function getSettings(chainId, deployer, ethers) {

    let AddressZero = ethers.constants.AddressZero;

    const multiSigAddress = CONFIG.MultiSig[hre.network.name];

    let setting = {

        testing: true,
        multisigAddress: multiSigAddress,

        chainLink_vrfId: 1,
        chainLink_linkToken: AddressZero,
        chainLink_vrfCoordinator: AddressZero,
        chainLink_linkKeyHash: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",

        chainLink_keeper: AddressZero,

        acceptTokens: [AddressZero],

        // Prices Oracle
        // reffer https://docs.chain.link/docs/binance-smart-chain-addresses/
        // bsc-mainnet BNB/USD 0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee
        // bsc-testnet BNB/USD 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
        priceOracle: AddressZero,
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
            setting.chainLink_vrfId = 266;
            setting.chainLink_linkToken = "0x404460c6a5ede2d891e8297795264fde62adbb75";
            setting.chainLink_vrfCoordinator = "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE";
            setting.chainLink_linkKeyHash = "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04";
            setting.acceptTokens = [
                "0x0000000000000000000000000000000000000000", //BNB
                "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", //WBNB
                "0xe9e7cea3dedca5984780bafc599bd69add087d56", //BUSD
                "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", //USDC
                "0x55d398326f99059fF775485246999027B3197955" //USDT
            ],
            setting.priceOracle = '0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee';
            setting.WETH = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

            setting.chainLink_keeper = "0x7b3EC232b08BD7b4b3305BE0C044D907B2DF960B";
            break;
        // bscTestnet
        case "97":
            setting.chainLink_vrfId = 200;
            setting.chainLink_linkToken = "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06";
            setting.chainLink_vrfCoordinator = "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f";
            setting.chainLink_linkKeyHash = "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314";
            setting.priceOracle = '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526';

            setting.chainLink_keeper = "0xA3E3026562a3ADAF7A761B10a45217c400a4054A";
            break;
        // Avalanche mainnet
        case "43114":
            // setting.chainLink_keeper = "";
            break;
        // Avalanche Fuji
        case "43113":
            setting.chainLink_keeper = "0x409CF388DaB66275dA3e44005D182c12EeAa12A0";
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