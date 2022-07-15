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
        console.log(`  -> OpenLuckOFT needs LayerZero: ${hre.network.name} LZEndpointMock: ${lzAddress}`)
    } else {
        console.log(hre.network.name)
        lzAddress = getLayerZeroAddress(hre.network.name)
        console.log(`  -> OpenLuckOFT needs LayerZero: ${hre.network.name} LayerZeroEndpoint: ${lzAddress}`)
    }

    if (hre.network.name !== "hardhat") {
        console.log(`OpenLuckOFT | mainEndpointId: ${mainEndpointId} | isTestnet: ${isTestnet()}`)
    }
    await deploy("OpenLuckOFT", {
        from: deployer,
        args: [
            lzAddress
        ],
        log: true,
        skipIfAlreadyDeployed: true,
        waitConfirmations: 1,
    })
}

//only deploy except BNB Chain
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            resolve(true);
            // resolve(!isTestnet());
            // resolve(hre.network.name.indexOf("bsc") >= 0);
        } catch (error) {
            reject(error)
        }
    });


module.exports.tags = ["OpenLuckOFT", "test"]
module.exports.dependencies = getDependencies()
