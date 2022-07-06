const { BigNumber, utils, Contract } = require('ethers');
const { ethers, upgrades } = require('hardhat');
let { getSettings } = require('../utils/deploySetting');
const { isLocalhost, isTestnet, isNetworkAllowTaskForTest } = require("../utils/network")
const { getLayerZeroAddress } = require("../utils/layerzero")
const CONFIG = require("../constants/config.json")
const upgradeContracts = require("../constants/upgradeContracts.json")

function getDependencies() {
    
    if (!isTestnet()) {
        return [];
    }
    let token = hre.network.name.indexOf("bsc") >= 0 ? "OpenLuckToken" : "OpenLuckOFT";
    if (isLocalhost()) {
        return ["LZEndpointMock", token]
    }
    return [token]
}

module.exports = async ({ ethers, getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    // Load deploy settings
    let setting = getSettings(chainId, deployer, ethers);

    // let OpenLuckToken = await ethers.getContract("OpenLuckToken")

    // ----------------------------------------------

    //  Deploy Contracts
    let LucksExecutor;
    let ProxyTokenStation;
    let LucksHelper;
    let LucksVRF;
    let LucksGroup;
    let LucksPaymentStrategy;
    let LucksAutoCloseTask;
    let LucksAutoDrawTask;
    let ProxyCryptoPunks;
    
    // Deploy Proxy - LucksExecutor
    {
         // contract code
        const code = await ethers.getContractFactory("LucksExecutor");
        if (upgradeContracts["LucksExecutor"][hre.network.name] == "") {           
            // deployProxy
            const instance = await upgrades.deployProxy(code, 
                [
                    setting.lzChainId, //_chainId 
                    setting.isAllowTask // _allowTask
                ],
                { initializer: "initialize" }
            );
            await instance.deployed();  
            // get contract
            LucksExecutor = code.attach(instance.address);            

            console.log(`DEPLOY >> Proxy LucksExecutor deployed! ${LucksExecutor.address}`);
        }
        else {
            LucksExecutor = code.attach(upgradeContracts["LucksExecutor"][hre.network.name]);
        }

        // Upgrade Proxy
        if (upgradeContracts["LucksExecutor"][hre.network.name] != "" && upgradeContracts["LucksExecutorImpl"][hre.network.name] == "") {  
            // deployProxy
            const instance = await upgrades.upgradeProxy(upgradeContracts["LucksExecutor"][hre.network.name],code);
            LucksExecutor = code.attach(instance.address);            

            console.log(`UPGRADE >> Proxy LucksExecutor upgraded! ${LucksExecutor.address}`);
        }
    }

    const ProxyNFTStation = await deploy('ProxyNFTStation', {
        from: deployer,
        args: [LucksExecutor.address],
        skipIfAlreadyDeployed: true,
        log: true,
    });

    // deploy LucksBridge
    let lzAddress
    if (isLocalhost()) {
        lzAddress = (await deployments.get("LZEndpointMock")).address;
        console.log(`  -> LZEndpointMock: ${lzAddress}`)
    } else {
        console.log(`Network: ${hre.network.name}`);
        lzAddress = getLayerZeroAddress(hre.network.name);
        console.log(`  -> LayerZeroEndpoint: ${lzAddress}`);
    }

    const LucksBridge = await deploy("LucksBridge", {
        from: deployer,
        args: [lzAddress, LucksExecutor.address],
        skipIfAlreadyDeployed: true,
        log: true,
    });


    if (isNetworkAllowTaskForTest()) {

        ProxyTokenStation = await deploy('ProxyTokenStation', {
            from: deployer,
            args: [LucksExecutor.address, setting.WETH],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        // LucksGroup
        {
            // contract code
           const code = await ethers.getContractFactory("LucksGroup");
           if (upgradeContracts["LucksGroup"][hre.network.name] == "") {           
               // deployProxy
               const instance = await upgrades.deployProxy(code, 
                   [
                        LucksExecutor.address, // _executor 
                        10 // _maxSeat
                   ],
                   { initializer: "initialize" }
               );
               await instance.deployed();  
               // get contract
               LucksGroup = code.attach(instance.address);            
   
               console.log(`DEPLOY >> Proxy LucksGroup deployed! ${LucksGroup.address}`);
           }
           else {
                LucksGroup = code.attach(upgradeContracts["LucksGroup"][hre.network.name]);
           }
   
           // Upgrade Proxy
           if (upgradeContracts["LucksGroup"][hre.network.name] != "" && upgradeContracts["LucksGroupImpl"][hre.network.name] == "") {  
               // deployProxy
               const instance = await upgrades.upgradeProxy(upgradeContracts["LucksGroup"][hre.network.name],code);
               LucksGroup = code.attach(instance.address);            
   
               console.log(`UPGRADE >> Proxy LucksGroup upgraded! ${LucksGroup.address}`);
           }
       }

        LucksPaymentStrategy = await deploy('LucksPaymentStrategy', {
            from: deployer,
            args: [LucksExecutor.address, LucksGroup.address],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        LucksVRF = await deploy('LucksVRF', {
            from: deployer,
            args: [
                setting.chainLink_vrfId,
                setting.chainLink_vrfCoordinator,
                setting.chainLink_linkToken,
                setting.chainLink_linkKeyHash,
                LucksExecutor.address],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        LucksAutoCloseTask = await deploy('LucksAutoCloseTask', {
            from: deployer,
            args: [
                setting.chainLink_keeper, //_keeperRegAddr The address of the keeper registry contract
                LucksExecutor.address], //LucksExecutor contract
            skipIfAlreadyDeployed: true,
            log: true,
        });

        LucksAutoDrawTask = await deploy('LucksAutoDrawTask', {
            from: deployer,
            args: [
                setting.chainLink_keeper, //_keeperRegAddr The address of the keeper registry contract
                LucksExecutor.address, //LucksExecutor contract
                LucksBridge.address, //LucksBridge contract
                setting.lzChainId
            ],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        LucksHelper = await deploy('LucksHelper', {
            from: deployer,
            args: [
                setting.acceptTokens,
                setting.multisigAddress,  //protocolFee recipient
                200, // protocolFee 2%
                LucksExecutor.address, // LucksExecutor
                LucksVRF.address, //LucksVRF
                LucksGroup.address, //LucksGroup
                LucksPaymentStrategy.address, //LucksPaymentStrategy
                LucksAutoCloseTask.address, // LucksAutoCloseTask
                LucksAutoDrawTask.address // LucksAutoDrawTask
            ],
            skipIfAlreadyDeployed: true,
            log: true,
        });
    }
    else {
        LucksHelper = await deploy('LucksHelper', {
            from: deployer,
            args: [
                setting.acceptTokens,
                setting.multisigAddress,  //protocolFee recipient
                200, // protocolFee 2%
                LucksExecutor.address,
                setting.AddressZero,  //LucksVRF
                setting.AddressZero, //LucksGroup
                setting.AddressZero, //LucksPaymentStrategy
                setting.AddressZero, // LucksAutoCloseTask
                setting.AddressZero // LucksAutoDrawTask
            ],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        ProxyCryptoPunks = await deploy('ProxyCryptoPunks', {
            from: deployer,
            args: [LucksExecutor.address, LucksHelper.address],
            skipIfAlreadyDeployed: true,
            log: true,
        });
    }

    console.log("DEPLOY >> Core Contracts deployed!");


    // ----------------------------------------------
    //  Update Contracts params
    {
        if (await LucksExecutor.HELPER() != LucksHelper.address) {
            
            await LucksExecutor.setLucksHelper(LucksHelper.address);
            console.log("UPDATE >> LucksExecutor setLucksHelper!")
        }

        if (await LucksExecutor.BRIDGE() != LucksBridge.address ||
            (ProxyTokenStation && await LucksExecutor.TOKEN() != ProxyTokenStation.address)||
            (ProxyNFTStation && await LucksExecutor.NFT() != ProxyNFTStation.address)) {
                
            await LucksExecutor.setBridgeAndProxy(
                LucksBridge.address,
                isNetworkAllowTaskForTest() ? ProxyTokenStation.address : setting.AddressZero,
                ProxyNFTStation.address);

            console.log("UPDATE >> LucksExecutor setBridgeAndProxy!")
        }


        if (ProxyNFTStation && ProxyNFTStation.address != setting.AddressZero) {
            let proxyNFT = await ethers.getContract("ProxyNFTStation");
            if (await proxyNFT.executors(LucksExecutor.address) == false) {
                await proxyNFT.setExecutor(LucksExecutor.address);
                console.log("UPDATE >> ProxyNFTStation > LucksExecutor!")
            }
        }

        if (ProxyTokenStation && ProxyTokenStation.address != setting.AddressZero) {
            let proxyToken = await ethers.getContract("ProxyTokenStation");
            if (await proxyToken.executors(LucksExecutor.address) == false) {
                await proxyToken.setExecutor(LucksExecutor.address);
                console.log("UPDATE >> ProxyTokenStation > LucksExecutor!")
            }
        }


        let helper = await ethers.getContract("LucksHelper")
        if (LucksVRF && await helper.getVRF() != LucksVRF.address) {
            
            await helper.setLucksVRF(LucksVRF.address);
            console.log("UPDATE >> LucksHelper > VRF!")
        }

        if (LucksPaymentStrategy && await helper.getSTRATEGY() != LucksPaymentStrategy.address) {
            
            await helper.setPaymentStrategy(LucksPaymentStrategy.address);
            console.log("UPDATE >> LucksHelper > LucksPaymentStrategy!")
        }

  
        if ((LucksAutoCloseTask && (await helper.getAutoClose() != LucksAutoCloseTask.address)) ||
            (LucksAutoDrawTask && await helper.getAutoDraw() != LucksAutoDrawTask.address)) {
            
            await  helper.setLucksAuto(LucksAutoCloseTask.address, LucksAutoDrawTask.address);
            console.log("UPDATE >> LucksHelper > setLucksAuto!")
        }
        

        if (LucksAutoCloseTask && LucksAutoCloseTask.address != setting.AddressZero) {
            let autoCloseTask = await ethers.getContract("LucksAutoCloseTask");
            if (LucksAutoCloseTask && await autoCloseTask.EXECUTOR() != LucksExecutor.address) {
                await autoCloseTask.setExecutor(LucksExecutor.address);
                console.log("UPDATE >> LucksAutoCloseTask > LucksExecutor!")
            }
        }

        if (LucksAutoDrawTask && LucksAutoDrawTask.address != setting.AddressZero) {
            let autoDrawTask = await ethers.getContract("LucksAutoDrawTask");
            if (LucksAutoDrawTask && await autoDrawTask.EXECUTOR() != LucksExecutor.address) {
                // await autoDrawTask.setExecutor(LucksExecutor.address);
                // console.log("UPDATE >> LucksAutoDrawTask > LucksExecutor!")
            }
        }

        if (LucksAutoDrawTask && LucksAutoDrawTask.address != setting.AddressZero) {
            let autoDrawTask = await ethers.getContract("LucksAutoDrawTask");
            if (LucksAutoDrawTask && await autoDrawTask.EXECUTOR() != LucksExecutor.address) {
                // await autoDrawTask.setExecutor(LucksExecutor.address);
                // console.log("UPDATE >> LucksAutoDrawTask > LucksExecutor!")
            }
        }
    }
}

module.exports.tags = ["LucksExecutor", "test"]
module.exports.dependencies = getDependencies()
