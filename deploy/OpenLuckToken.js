const { getLayerZeroAddress } = require("../utils/layerzero")
const CONFIG = require("../constants/config.json")
const { isTestnet, isLocalhost, getEndpointIdByName } = require("../utils/network")

function getDependencies() {
    if (isLocalhost()) {
        return ["LZEndpointMock"]
    }
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let mainEndpointId = CONFIG.OpenLuckToken.mainEndpointId // BSC
    if (isTestnet() && !isLocalhost()) {
        // for testnet, mint a bunch of tokens on every chain
        mainEndpointId = getEndpointIdByName(hre.network.name)
    }

    let lzAddress
    if (isLocalhost()) {
        lzAddress = (await deployments.get("LZEndpointMock")).address
        console.log(`  -> OpenLuckToken needs LayerZero: ${hre.network.name} LZEndpointMock: ${lzAddress}`)
    } else {
        console.log(hre.network.name)
        lzAddress = getLayerZeroAddress(hre.network.name)
        console.log(`  -> OpenLuckToken needs LayerZero: ${hre.network.name} LayerZeroEndpoint: ${lzAddress}`)
    }

    const premintAddress = CONFIG.OpenLuckToken.premintAddress
    const premintAmount = ethers.utils.parseUnits(CONFIG.OpenLuckToken.premintAmount, 18);
    const globalSupply = ethers.utils.parseUnits(CONFIG.OpenLuckToken.globalSupply, 18);
    if (hre.network.name !== "hardhat") {
        console.log(`OpenLuckToken | mainEndpointId: ${mainEndpointId} | isTestnet: ${isTestnet()}`)
    }
    await deploy("OpenLuckToken", {
        from: deployer,
        args: [
            lzAddress,
            premintAddress,
            premintAmount,
            globalSupply
        ],
        log: true,
        skipIfAlreadyDeployed: true,
        waitConfirmations: 1,
    })
}

//only deploy for BNB Chain
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            resolve(!isTestnet());
            // resolve(hre.network.name.indexOf("bsc") < 0)
        } catch (error) {
            reject(error)
        }
    });


module.exports.tags = ["OpenLuckToken", "test"]
module.exports.dependencies = getDependencies()
