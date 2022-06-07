const { ethers } = require('hardhat');
const CONFIG = require("../constants/config.json")
const { isTestnet, isLocalhost, getEndpointIdByName } = require("../utils/network")

function getDependencies() {
   return [];
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("TokenPrices", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
        waitConfirmations: 1,
    });

    let TokenPrices = await ethers.getContract("TokenPrices");

    let feeds = CONFIG.PriceFeeds[hre.network.name];
    if (feeds && feeds.length > 0){
        for(let i=0; i <feeds.length;i++){ 
            let feed = feeds[i];
            let currency = feed.name.split("/")[1].trim();
            let token = feed.name.split("/")[0].trim();
            let address = feed.value;
            let decimals = feed.decimals;

            let feeder = await TokenPrices.getFeed(currency, token);
            if (feeder.feed != address) {                
                await TokenPrices.addFeed(currency, token, decimals, address);
                console.log(`  -> TokenPrices addFeed: ${hre.network.name} fee: ${feed.name}`)
            }
        }
    }

}

//only deploy for BNB Chain
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            resolve(hre.network.name.indexOf("bsc") < 0)
        } catch (error) {
            reject(error)
        }
    });


module.exports.tags = ["OpenLuckToken", "test"]
module.exports.dependencies = getDependencies()
