const CONFIG = require("../constants/config.json")
const { getDeploymentAddresses } = require("../utils/readDeployments")

task("lzEndpointMock", "connect the local openluck to a remote openluck by configuring the remote bridge")
    .addParam("targetNetworks", "the remote Stargate instance named by network")

    .setAction(async (taskArgs, hre) => {
        let accounts = await ethers.getSigners()
        let owner = accounts[0] // me
        // console.log(`owner: ${owner.address}`);

        const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        const srcEndpintAddr = (await hre.deployments.get("LZEndpointMock")).address
        const srcEndpint = await LZEndpointMock.attach(srcEndpintAddr)

        let targetNetworks = taskArgs.targetNetworks.split(",")

        console.log(`${hre.network.name}: setting DestLzEndpoint...`)
        for (let targetNetwork of targetNetworks) {
            let targetNetworkAddrs = getDeploymentAddresses(targetNetwork)

            let targetBridgeAddr = ethers.utils.getAddress(targetNetworkAddrs["LucksBridge"]) // cast to standardized address
            let targetEndpointAddr = ethers.utils.getAddress(targetNetworkAddrs["LZEndpointMock"])

            const destLzEndpoint = await srcEndpint.lzEndpointLookup(targetBridgeAddr)
            if (destLzEndpoint === "0x0000000000000000000000000000000000000000") {
                // set it if its not set
                await srcEndpint.setDestLzEndpoint(targetBridgeAddr, targetEndpointAddr);

                console.log(
                    ` ✅ ${hre.network.name} > bridge.setDestLzEndpoint(targetBridgeAddr:${targetBridgeAddr}, targetEndpointAddr:${targetEndpointAddr} | *already set*`
                )
            }
        }
    })
