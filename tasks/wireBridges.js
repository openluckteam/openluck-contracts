const CONFIG = require("../constants/config.json")
const { getDeploymentAddresses } = require("../utils/readDeployments")
const { getEndpointId, getEndpointIdByName } = require("../utils/network")
// const { getEndpointIdByName } = require("@layerzerolabs/core-sdk")

task("wireBridges", "connect the local openluck to a remote openluck by configuring the remote bridge")
    .addParam("targetNetworks", "the remote Stargate instance named by network")

    .setAction(async (taskArgs, hre) => {
        let accounts = await ethers.getSigners()
        let owner = accounts[0] // me
        // console.log(`owner: ${owner.address}`);

        const LucksBridge = await ethers.getContractFactory("LucksBridge")
        const bridgeAddr = (await hre.deployments.get("LucksBridge")).address
        const bridge = await LucksBridge.attach(bridgeAddr)

        let targetNetworks = taskArgs.targetNetworks.split(",")

        console.log(`${hre.network.name}: setting local functionType gas and remote bridge...`);
        
        for (let targetNetwork of targetNetworks) {
            let targetNetworkAddrs = getDeploymentAddresses(targetNetwork)
            // console.log(targetNetworkAddrs);
            let chainId = getEndpointIdByName(targetNetwork)

            let numFunctionTypes = Object.keys(CONFIG.gasAmounts).length
            for (let functionType = 1; functionType <= numFunctionTypes; ++functionType) {
                let gasAmount = CONFIG.gasAmounts[functionType]
                let currentAmount = await bridge.gasLookup(chainId, functionType)
                if (currentAmount.eq(gasAmount)) {
                    console.log(
                        ` ✅ ${hre.network.name} > bridge.setGasAmount(chainId:${chainId}, functionType:${functionType}, gasAmount:${gasAmount}) | *already set*`
                    )
                } else {
                    await (await bridge.setGasAmount(chainId, functionType, gasAmount)).wait()
                    console.log(
                        ` ✅ ${hre.network.name} > bridge.setGasAmount(chainId:${chainId}, functionType:${functionType}, gasAmount:${gasAmount})`
                    )
                }
            }

            let currBridge = await bridge.trustedRemoteLookup(chainId)
            let targetBridgeAddr = ethers.utils.getAddress(targetNetworkAddrs["LucksBridge"]) // cast to standardized address
            if (currBridge !== "0x" && ethers.utils.getAddress(currBridge) == targetBridgeAddr) {
                // its nto a bridge
                console.log(`✅ ${hre.network.name} > setTrustedRemote(${chainId}, ${targetBridgeAddr}) | *already set*`)
            } else {
                // setTrustedRemote , 1-time only call. better do it right!
                let tx = await (await bridge.setTrustedRemote(chainId, targetBridgeAddr)).wait()
                console.log(` ✅ ${hre.network.name} > setTrustedRemote(${chainId}, ${targetBridgeAddr}) | tx: ${tx.transactionHash}`)
            }
        }
    })
