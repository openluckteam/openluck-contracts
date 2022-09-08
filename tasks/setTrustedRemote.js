const CONFIG = require("../constants/config.json")
const { getDeploymentAddresses } = require("../utils/readDeployments")
const { getEndpointId, getEndpointIdByName } = require("../utils/network")
// const { getEndpointIdByName } = require("@layerzerolabs/core-sdk")

task("setTrustedRemote", "connect the local openluck to a remote openluck by configuring the remote bridge")
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
            let chainId = getEndpointIdByName(targetNetwork)        
          
            let currBridge = await bridge.trustedRemoteLookup(chainId)
            let targetBridgeAddr = ethers.utils.getAddress(targetNetworkAddrs["LucksBridge"]) // cast to standardized address

            let trustedRemote = hre.ethers.utils.solidityPack(
                ['address','address'],
                [targetBridgeAddr, bridgeAddr]
            )

            if (currBridge !== "0x" && ethers.utils.getAddress(currBridge) == trustedRemote) {
                // its nto a bridge
                console.log(`✅ ${hre.network.name} > setTrustedRemote(${chainId}, ${targetBridgeAddr}) | *already set*`)
            } else {
                // setTrustedRemote , 1-time only call. better do it right!
                let tx = await (await bridge.setTrustedRemote(chainId, trustedRemote)).wait()
                console.log(` ✅ ${hre.network.name} > setTrustedRemote(${chainId}, ${trustedRemote}) | tx: ${tx.transactionHash}`)
            }
        }
    })
