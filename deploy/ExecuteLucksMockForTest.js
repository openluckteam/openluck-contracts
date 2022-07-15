const { utils } = require('ethers');
const { isTestnet, isLocalhost, getEndpointId, isNetworkAllowTaskForTest } = require("../utils/network")
const CONFIG = require("../constants/config.json")
const upgradeContracts = require("../constants/upgradeContracts.json")

function getDependencies() {
    if (isLocalhost()) {
        return ["LZEndpointMock", "LucksExecutor"];
    }
    return ["LucksExecutor"];
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer, caller, joiner, joiner2 } = await getNamedAccounts()
    let [deployerSign] = await ethers.getSigners();

    console.log('DEPLOY >> deploy Mock for Tests: starting')

    const LucksExecutorBox = await ethers.getContractFactory("LucksExecutor");
    const executor = LucksExecutorBox.attach(upgradeContracts["LucksExecutor"][hre.network.name]);

    // =================== Deploy Local VRF ===================
    const lucksHelper = await ethers.getContract("LucksHelper");


    if (isLocalhost()) {

        if (getEndpointId() > 1) {
            const LocalLucksVRF = await deploy('LocalLucksVRF', {
                from: deployer,
                args: [1,
                    ethers.constants.AddressZero,
                    ethers.constants.AddressZero,
                    '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
                    executor.address
                ],
                skipIfAlreadyDeployed: true,
                log: true,
            });

            if (await lucksHelper.getVRF() != LocalLucksVRF.address) {
                await lucksHelper.setLucksVRF(LocalLucksVRF.address);
                console.log("UPDATE >> LocalLucksVRF settings updated");
            }
        }
    }
}

//only deploy for testnets
module.exports.skip = ({ getChainId }) =>
    new Promise(async (resolve, reject) => {
        try {
            resolve(!isTestnet());
        } catch (error) {
            reject(error)
        }
    })

module.exports.tags = ["LucksExecutorMockForTest", "test"]
module.exports.dependencies = getDependencies()
