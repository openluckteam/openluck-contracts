const getContracts = require('../utils/getContracts');
const { isNetworkAllowTaskForTest } = require("../utils/network")
const { getDeploymentAddresses } = require("../utils/readDeployments")
const CONFIG = require("../constants/config.json")

task("checkSettings", "cheking the smartcontracts interfaces and variables settings")
    .addParam("autoFix", "the remote Stargate instance named by network")
    .setAction(async (taskArgs, hre) => {

        let autoFix = taskArgs.autoFix == "true";

        // let accounts = await ethers.getSigners()       
        let [deployer] = await ethers.getSigners();

        let { contracts, acceptToken } = await getContracts(hre);

        //LucksExecutor
        {
            if (await contracts.LucksExecutor.HELPER() == contracts.LucksHelper.address) {
                console.log(` ✅ ${hre.network.name} > LucksExecutor.HELPER | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksExecutor.HELPER ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksExecutor.connect(deployer).setLucksHelper(contracts.LucksHelper.address);
                    console.log(` ✅ ${hre.network.name} > LucksExecutor.HELPER | *already Fixed*`);
                }
            }

            if (await contracts.LucksExecutor.NFT() == contracts.ProxyNFTStation.address) {
                console.log(` ✅ ${hre.network.name} > LucksExecutor.NFT | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksExecutor.NFT ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksExecutor.connect(deployer).setBridgeAndProxy(contracts.LucksBridge.address,
                        contracts.ProxyTokenStation.address, contracts.ProxyNFTStation.address);
                    console.log(` ✅ ${hre.network.name} > LucksExecutor.setBridgeAndProxy | *already Fixed*`);
                }
            }

            if (contracts.ProxyTokenStation) {
                if (await contracts.LucksExecutor.TOKEN() == contracts.ProxyTokenStation.address) {
                    console.log(` ✅ ${hre.network.name} > LucksExecutor.TOKEN | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksExecutor.TOKEN ==> Wrong set`);
                }
            }

            if (await contracts.LucksExecutor.BRIDGE() == contracts.LucksBridge.address) {
                console.log(` ✅ ${hre.network.name} > LucksExecutor.BRIDGE | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksExecutor.BRIDGE ==> Wrong set`);
            }
        }

        //LucksBridge
        {           
            if (await contracts.LucksBridge.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksBridge.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksBridge.EXECUTOR ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksBridge.connect(deployer).setExecutor(contracts.LucksExecutor.address);
                    console.log(` ✅ ${hre.network.name} > LucksBridge.EXECUTOR | *already Fixed*`);
                }
            }
        }

        //LucksHelper
        {
            if (await contracts.LucksHelper.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.EXECUTOR ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksHelper.connect(deployer).setExecutor(contracts.LucksExecutor.address);
                    console.log(` ✅ ${hre.network.name} > LucksHelper.EXECUTOR | *already Fixed*`);
                }
            }

            if (isNetworkAllowTaskForTest()) {
                if (await contracts.LucksHelper.VRF() == contracts.LucksVRF.address) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.VRF | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.VRF ==> Wrong set`);
                }

                if (await contracts.LucksHelper.GROUPS() == contracts.LucksGroup.address) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.GROUPS | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.GROUPS ==> Wrong set.`);
                    if (autoFix) {
                        await contracts.LucksHelper.connect(deployer).setLucksGroup(contracts.LucksGroup.address);
                        console.log(` ✅ ${hre.network.name} > LucksHelper.GROUPS | *already Fixed*`);
                    }
                }

                if (await contracts.LucksHelper.STRATEGY() == contracts.LucksPaymentStrategy.address) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.STRATEGY | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.STRATEGY ==> Wrong set`);
                }

                if (await contracts.LucksHelper.AUTO_CLOSE() == contracts.LucksAutoCloseTask.address) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.AUTO_CLOSE | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.AUTO_CLOSE ==> Wrong set`);
                }

                if (await contracts.LucksHelper.AUTO_DRAW() == contracts.LucksAutoDrawTask.address) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.AUTO_DRAW | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.AUTO_DRAW ==> Wrong set`);
                }

                // tokens
                if (await contracts.LucksHelper.acceptTokens(acceptToken.BUSD) == true) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.acceptTokens - BUSD | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.acceptTokens - BUSD ==> Wrong set`);                   
                }

                if (await contracts.LucksHelper.acceptTokens(acceptToken.USDC) == true) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.acceptTokens - USDC | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.acceptTokens - USDC ==> Wrong set`);
                }

                if (await contracts.LucksHelper.acceptTokens(acceptToken.USDT) == true) {
                    console.log(` ✅ ${hre.network.name} > LucksHelper.acceptTokens - USDT | *already set*`);
                }
                else {
                    console.log(` ✘ ${hre.network.name} > LucksHelper.acceptTokens - USDT ==> Wrong set`);
                    if(autoFix){
                        await contracts.LucksHelper.connect(deployer).setAcceptTokens(
                            [
                                acceptToken.BNB,
                                acceptToken.WBNB,
                                acceptToken.BUSD,
                                acceptToken.USDC,
                                acceptToken.USDT
                            ], true
                        );
                        console.log(` ✘ ${hre.network.name} > LucksHelper.acceptTokens ==> Fixed`);
                    }
                }

            }

            if (await contracts.LucksHelper.feeRecipient() == deployer.address) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.feeRecipient | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.feeRecipient ==> Wrong set`);
            }

            // minTargetAmount
            if (await contracts.LucksHelper.getMinTargetLimit(acceptToken.BNB) == 0) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.getMinTargetLimit - BNB | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.getMinTargetLimit - BNB ==> Wrong set`);
            }

            if (await contracts.LucksHelper.getMinTargetLimit(acceptToken.BUSD) == 0) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.getMinTargetLimit - BUSD | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.getMinTargetLimit - BUSD ==> Wrong set`);
            }

            if (await contracts.LucksHelper.getMinTargetLimit(acceptToken.USDC) == 0) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.getMinTargetLimit - USDC | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.getMinTargetLimit - USDC ==> Wrong set`);
            }

            if (await contracts.LucksHelper.getMinTargetLimit(acceptToken.USDT) == 0) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.getMinTargetLimit - USDT | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.getMinTargetLimit - USDT ==> Wrong set`);
            }

        }

        // ProxyNFTStation
        {
            if (await contracts.ProxyNFTStation.executors(contracts.LucksExecutor.address) == true) {
                console.log(` ✅ ${hre.network.name} > ProxyNFTStation.executor | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > ProxyNFTStation.executor ==> Wrong set`);
            }
        }

        // ProxyTokenStation
        if (contracts.ProxyTokenStation) {
            if (await contracts.ProxyTokenStation.executors(contracts.LucksExecutor.address) == true) {
                console.log(` ✅ ${hre.network.name} > ProxyTokenStation.executor | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > ProxyTokenStation.executor ==> Wrong set`);
            }
        }


        // LucksGroup
        if (contracts.LucksGroup) {
            if (await contracts.LucksGroup.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksGroup.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksGroup.EXECUTOR ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksGroup.connect(deployer).setExecutor(contracts.LucksExecutor.address);
                    console.log(` ✅ ${hre.network.name} > LucksGroup.EXECUTOR | *already Fixed*`);
                }
            }
        }

        // LucksVRF
        if (contracts.LucksVRF) {
            if (await contracts.LucksVRF.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksVRF.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksVRF.EXECUTOR ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksVRF.connect(deployer).setExecutor(contracts.LucksExecutor.address);
                    console.log(` ✅ ${hre.network.name} > LucksVRF.EXECUTOR | *already Fixed*`);
                }
            }
        }

        // LucksAutoCloseTask
        if (contracts.LucksAutoCloseTask) {
            if (await contracts.LucksAutoCloseTask.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksAutoCloseTask.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksAutoCloseTask.EXECUTOR ==> Wrong set`);
            }
        }

        // LucksAutoDrawTask
        if (contracts.LucksAutoDrawTask) {
            if (await contracts.LucksAutoDrawTask.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksAutoDrawTask.EXECUTOR ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksAutoDrawTask.connect(deployer).setExecutor(contracts.LucksExecutor.address);
                    console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask.EXECUTOR | *already Fixed*`);
                }
            }

            if (await contracts.LucksAutoDrawTask.BRIDGE() == contracts.LucksBridge.address) {
                console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask.BRIDGE | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksAutoDrawTask.BRIDGE ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksAutoDrawTask.connect(deployer).setBridge(contracts.LucksBridge.address);
                    console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask.BRIDGE | *already Fixed*`);
                }
            }
        }

        // LucksPaymentStrategy
        if (contracts.LucksPaymentStrategy) {
            if (await contracts.LucksPaymentStrategy.EXECUTOR() == contracts.LucksExecutor.address) {
                console.log(` ✅ ${hre.network.name} > LucksPaymentStrategy.EXECUTOR | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksPaymentStrategy.EXECUTOR ==> Wrong set`);
            }

            if (await contracts.LucksPaymentStrategy.GROUPS() == contracts.LucksGroup.address) {
                console.log(` ✅ ${hre.network.name} > LucksPaymentStrategy.GROUPS | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksPaymentStrategy.GROUPS ==> Wrong set`);
            }
        }

        // CryptoPunks
        if (contracts.ProxyCryptoPunks) {

            let punkAddress = CONFIG.CryptoPunk;

            if (!isNetworkAllowTaskForTest()) {
                let taskNetworkAddrs = getDeploymentAddresses(hre.network.name);
                punkAddress = ethers.utils.getAddress(taskNetworkAddrs["EthCryptoPunksMarket"]);
            }

            if (await contracts.LucksHelper.PUNKS() == punkAddress) {
                console.log(` ✅ ${hre.network.name} > LucksHelper.PUNKS | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper.PUNKS ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksHelper.connect(deployer).setPunks(punkAddress, contracts.ProxyCryptoPunks.address);
                    console.log(` ✅ ${hre.network.name} > LucksHelper.PUNKS | *already Fixed*`);
                }
            }
            
        }
    })
