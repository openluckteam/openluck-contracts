const { isLocalhost } = require("../utils/network")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy("TestTicket", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });

    console.log(`TestTicket`);
}

//only deploy for chainId 31337
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            resolve(!isLocalhost());
        } catch (error) {
            reject(error)
        }
    })

module.exports.tags = ["TestTicket", "test"]
