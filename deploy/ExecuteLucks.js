const { BigNumber, utils, Contract } = require('ethers');
const { ethers } = require('hardhat');
let { getSettings } = require('../utils/deploySetting');
const { isLocalhost,isNetworkAllowTaskForTest } = require("../utils/network")
const { getLayerZeroAddress } = require("../utils/layerzero")

function getDependencies() {
    if (isLocalhost()) {
        return ["LZEndpointMock", "OpenLuckToken"]
    }
    return ["OpenLuckToken"]
}

module.exports = async ({ ethers, getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    // Load deploy settings
    let setting = getSettings(chainId, deployer, ethers);

    let OpenLuckToken = await ethers.getContract("OpenLuckToken")

    // ----------------------------------------------

    //  Deploy Contracts
    const LucksExecutor = await deploy("LucksExecutor", {
        from: deployer,
        args: [
            setting.AddressZero, //_helper, update later
            setting.lzChainId, //_chainId 
            setting.isAllowTask // _allowTask
        ],
        log: true,
        skipIfAlreadyDeployed: true,
        waitConfirmations: 1,
    });

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

    // deploy Other contracts
    let executor = await ethers.getContract("LucksExecutor");
    let ProxyTokenStation;
    let LucksHelper;
    let LucksVRF;
    let LucksGroup;
    let LucksPaymentStrategy;
    let LucksAutoCloseTask;
    let LucksAutoDrawTask;

    if (isNetworkAllowTaskForTest()) {

        ProxyTokenStation = await deploy('ProxyTokenStation', {
            from: deployer,
            args: [LucksExecutor.address, setting.WETH],
            skipIfAlreadyDeployed: true,
            log: true,
        });

        LucksGroup = await deploy('LucksGroup', {
            from: deployer,
            args: [LucksExecutor.address, OpenLuckToken.address, 10],
            skipIfAlreadyDeployed: true,
            log: true,
        });

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
                deployer,  //protocolFee recipient
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
                deployer,  //protocolFee recipient
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

    }
    
    console.log("DEPLOY >> Core Contracts deployed!");
 
    // ----------------------------------------------
    //  Update Contracts params
    {    
        if (await executor.HELPER() != LucksHelper.address) {
            executor.setLucksHelper(LucksHelper.address);
            console.log("UPDATE >> LucksExecutor setLucksHelper!")
        }

        if (await executor.BRIDGE() != LucksBridge.address ||
            (ProxyTokenStation && await executor.PROXY_TOKEN() != ProxyTokenStation.address)) {

            executor.setBridgeAndProxy(
                LucksBridge.address,  
                isNetworkAllowTaskForTest()? ProxyTokenStation.address: setting.AddressZero, 
                ProxyNFTStation.address);
            console.log("UPDATE >> LucksExecutor setBridgeAndProxy!")
        }

        let helper = await ethers.getContract("LucksHelper")
        if (LucksVRF && await helper.getVRF() != LucksVRF.address) {
            helper.setLucksVRF(LucksVRF.address);
            console.log("UPDATE >> LucksHelper > VRF!")
        }

        if (LucksPaymentStrategy && await helper.getSTRATEGY() != LucksPaymentStrategy.address) {
            helper.setPaymentStrategy(LucksPaymentStrategy.address);
            console.log("UPDATE >> LucksHelper > LucksPaymentStrategy!")
        }
        
        if ((LucksAutoCloseTask && (await helper.getAutoClose() != LucksAutoCloseTask.address)) || 
            (LucksAutoDrawTask && await helper.getAutoDraw() != LucksAutoDrawTask.address)) {
            helper.setLucksAuto(LucksAutoCloseTask.address, LucksAutoDrawTask.address);
            console.log("UPDATE >> LucksHelper > setLucksAuto!")
        }
    }
}

module.exports.tags = ["LucksExecutor", "test"]
module.exports.dependencies = getDependencies()
