const { getEndpointId, isLocalhost } = require("../utils/network")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy("LZEndpointMock", {
        from: deployer,
        args: [await getEndpointId()],
        log: true,
        waitConfirmations: 1,
    });

    console.log(`LZEndpointMock chainId: ${getEndpointId()}`);
}

//only deploy for chainId 31337
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            // const chainId = await getChainId();
            // resolve(chainId !== "31337")
            resolve(!isLocalhost());
        } catch (error) {
            reject(error)
        }
    })

module.exports.tags = ["LZEndpointMock", "test"]
