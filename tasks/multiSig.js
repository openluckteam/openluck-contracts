const getContracts = require('../utils/getContracts');
const CONFIG = require("../constants/config.json")

task("multiSig", "checking and transfer ownership to multiSig accounts")
    .addParam("autoFix", "the remote Stargate instance named by network")
    .setAction(async (taskArgs, hre) => {

        let autoFix = taskArgs.autoFix == "true";
 
        let [deployer] = await ethers.getSigners();

        let { contracts } = await getContracts(hre);

        const multiSigAddress = CONFIG.MultiSig[hre.network.name];
        if (multiSigAddress == "") {
            console.log(` ✅ ${hre.network.name} > Empty multiSigAddress`);
            return;
        }

        //LucksExecutor
        {            
            if (await contracts.LucksExecutor.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksExecutor | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksExecutor ==> Wrong set. ${contracts.LucksExecutor.address}`);
                if (autoFix) {
                    await contracts.LucksExecutor.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksExecutor | *already Fixed*`);
                }
            }
        }

        //LucksBridge
        {            
            if (await contracts.LucksBridge.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksBridge | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksBridge ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksBridge.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksBridge | *already Fixed*`);
                }
            }
        }

        //LucksHelper
        {            
            if (await contracts.LucksHelper.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksHelper | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksHelper ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksHelper.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksHelper | *already Fixed*`);
                }
            }
        }

        // ProxyNFTStation
        {
            if (await contracts.ProxyNFTStation.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > ProxyNFTStation | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > ProxyNFTStation ==> Wrong set`);
                if (autoFix) {
                    await contracts.ProxyNFTStation.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > ProxyNFTStation | *already Fixed*`);
                }
            }
        }

        // ProxyTokenStation
        if (contracts.ProxyTokenStation) {
            if (await contracts.ProxyTokenStation.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > ProxyTokenStation | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > ProxyTokenStation ==> Wrong set`);
                if (autoFix) {
                    await contracts.ProxyTokenStation.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > ProxyTokenStation | *already Fixed*`);
                }
            }
        }


        // LucksGroup
        if (contracts.LucksGroup) {
            if (await contracts.LucksGroup.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksGroup | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksGroup ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksGroup.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksGroup | *already Fixed*`);
                }
            }
        }

        // LucksVRF
        if (contracts.LucksVRF) {
            if (await contracts.LucksVRF.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksVRF | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksVRF ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksVRF.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksVRF | *already Fixed*`);
                }
            }
        }

        // LucksAutoCloseTask
        if (contracts.LucksAutoCloseTask) {
            if (await contracts.LucksAutoCloseTask.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksAutoCloseTask | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksAutoCloseTask ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksAutoCloseTask.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksAutoCloseTask | *already Fixed*`);
                }
            }
        }

        // LucksAutoDrawTask
        if (contracts.LucksAutoDrawTask) {
            if (await contracts.LucksAutoDrawTask.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksAutoDrawTask ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksAutoDrawTask.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksAutoDrawTask | *already Fixed*`);
                }
            }
        }

        // LucksPaymentStrategy
        if (contracts.LucksPaymentStrategy) {
            if (await contracts.LucksPaymentStrategy.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > LucksPaymentStrategy | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > LucksPaymentStrategy ==> Wrong set`);
                if (autoFix) {
                    await contracts.LucksPaymentStrategy.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > LucksPaymentStrategy | *already Fixed*`);
                }
            }
        }

        // ProxyCryptoPunks
        if (contracts.ProxyCryptoPunks) {

            if (await contracts.ProxyCryptoPunks.owner() == multiSigAddress) {
                console.log(` ✅ ${hre.network.name} > ProxyCryptoPunks | *already set*`);
            }
            else {
                console.log(` ✘ ${hre.network.name} > ProxyCryptoPunks ==> Wrong set`);
                if (autoFix) {
                    await contracts.ProxyCryptoPunks.connect(deployer).transferOwnership(multiSigAddress);
                    console.log(` ✅ ${hre.network.name} > ProxyCryptoPunks | *already Fixed*`);
                }
            }
            
        }
    })
