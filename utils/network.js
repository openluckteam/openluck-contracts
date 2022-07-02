// const { CHAIN_STAGE, CHAIN_ID, ChainStage } = require("@layerzerolabs/core-sdk")
const lzChainIds = require("../constants/lzChainIds.json")

// layerZero ChainId
const ChainId = {
    // mainet
    ETHEREUM: 1,
    BSC: 2,
    AVALANCHE: 6,
    POLYGON: 9,
    ARBITRUM: 10,
    OPTIMISM: 11,
    FANTOM: 12,

    // testnet
    RINKEBY: 10001,
    BSC_TESTNET: 10002,
    FUJI: 10006,
    MUMBAI: 10009,
    ARBITRUM_RINKEBY: 10010,
    OPTIMISM_KOVAN: 10011,
    FANTOM_TESTNET: 10012
}

function isLocalhost() {
    return hre.network.name.indexOf("localhost") >= 0 ||
        hre.network.name === "hardhat";
}

function isTestnet() {
    return (
        hre.network.name.indexOf("localhost") >= 0 ||
        hre.network.name.indexOf("testnet") >= 0 ||
        hre.network.name === "hardhat"
    )
}

function getEndpointId() {
    return lzChainIds[hre.network.name]
}

function getEndpointIdByName(name) {
    return lzChainIds[name];
}

function isNetworkAllowTaskForTest() {
    return !(getEndpointId() == 1 || getEndpointId() == 10001);
}

function getTaskNetworkNameForTest() {
    if (isNetworkAllowTaskForTest())
        return hre.network.name;
    else
        return hre.network.name.indexOf("testnet") >= 0 ? "bsctestnet-testnet" : "localhost-bsc";
}

function getNftChainIdForTest() {
    return getEndpointId();
}

function getTaskChainIdForTest() {
    return getEndpointIdByName(getTaskNetworkNameForTest());
}


module.exports = {
    LzChainId: lzChainIds,
    getEndpointId,
    isLocalhost,
    isTestnet,
    getEndpointIdByName,
    isNetworkAllowTaskForTest,
    getTaskNetworkNameForTest,
    getNftChainIdForTest,
    getTaskChainIdForTest
};
