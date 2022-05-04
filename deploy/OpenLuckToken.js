const { getLayerZeroAddress } = require("../utils/layerzero")
const CONFIG = require("../constants/config.json")
const { isTestnet, isLocalhost,getEndpointIdByName } = require("../utils/network")
// const { getEndpointIdByName } = require("@layerzerolabs/core-sdk")

function getDependencies() {
    if (isLocalhost()) {
        return ["LZEndpointMock"]
    }
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    let lzAddress
    if (isLocalhost()) {
        lzAddress = (await deployments.get("LZEndpointMock")).address
        console.log(`  -> OpenLuckToken needs LayerZero: ${hre.network.name} LZEndpointMock: ${lzAddress}`)
    } else {
        console.log(hre.network.name)
        lzAddress = getLayerZeroAddress(hre.network.name)
        console.log(`  -> OpenLuckToken needs LayerZero: ${hre.network.name} LayerZeroEndpoint: ${lzAddress}`)
    }

    let mainEndpointId = CONFIG.OpenLuckToken.mainEndpointId // BSC
    if (isTestnet() && !isLocalhost()) {
        // for testnet, mint a bunch of tokens on every chain
        mainEndpointId = getEndpointIdByName(hre.network.name)
    }

    let tokenName = CONFIG.OpenLuckToken.name
    let tokenSymbol = CONFIG.OpenLuckToken.symbol
    if (hre.network.name !== "hardhat") {
        console.log(`OpenLuckToken name: ${tokenName}, symbol:${tokenSymbol} | mainEndpointId: ${mainEndpointId} | isTestnet: ${isTestnet()}`)
    }
    await deploy("OpenLuckToken", {
        from: deployer,
        args: [tokenName, tokenSymbol, lzAddress, mainEndpointId, CONFIG.OpenLuckToken.initialSupplyMainEndpoint],
        log: true,
        skipIfAlreadyDeployed: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["OpenLuckToken", "test"]
module.exports.dependencies = getDependencies()
