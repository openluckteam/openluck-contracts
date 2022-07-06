const CONFIG = require("../constants/config.json");
const { getDeploymentAddresses } = require("./readDeployments");
const { getTaskNetworkNameForTest, isNetworkAllowTaskForTest, isTestnet} = require("./network")
const acceptTokens = require("../constants/acceptTokens.json");
const upgradeContracts = require("../constants/upgradeContracts.json")

module.exports = async function(hre) {

  
    const executor = await ethers.getContractFactory("LucksExecutor");        
    const LucksExecutor = executor.attach(upgradeContracts["LucksExecutor"][hre.network.name]);

    const bridge = await ethers.getContractFactory("LucksBridge");
    const bridgeAddr = (await hre.deployments.get("LucksBridge")).address;
    const LucksBridge = await bridge.attach(bridgeAddr);

    const helper = await ethers.getContractFactory("LucksHelper");
    const helperAddr = (await hre.deployments.get("LucksHelper")).address;
    const LucksHelper = await helper.attach(helperAddr);

    const nft = await ethers.getContractFactory("ProxyNFTStation");
    const nftAddr = (await hre.deployments.get("ProxyNFTStation")).address;
    const ProxyNFTStation = await nft.attach(nftAddr);

    let ProxyTokenStation;
    let LucksVRF;
    let LucksGroup;
    let LucksPaymentStrategy;
    let LucksAutoCloseTask;
    let LucksAutoDrawTask;
    let acceptToken;   
    let ProxyCryptoPunks;
    if (isNetworkAllowTaskForTest()) {
        const token = await ethers.getContractFactory("ProxyTokenStation");
        const tokenAddr = (await hre.deployments.get("ProxyTokenStation")).address;
        ProxyTokenStation = await token.attach(tokenAddr);

        const vrf = await ethers.getContractFactory("LucksVRF");
        const vrfAddr = (await hre.deployments.get("LucksVRF")).address;
        LucksVRF = await vrf.attach(vrfAddr);

        // const group = await ethers.getContractFactory("LucksGroup");
        // const groupAddr = (await hre.deployments.get("LucksGroup")).address;
        // LucksGroup = await group.attach(groupAddr);

        const group = await ethers.getContractFactory("LucksGroup");        
        LucksGroup = group.attach(upgradeContracts["LucksGroup"][hre.network.name]);

        const strategy = await ethers.getContractFactory("LucksPaymentStrategy");
        const strategyAddr = (await hre.deployments.get("LucksPaymentStrategy")).address;
        LucksPaymentStrategy = await strategy.attach(strategyAddr);    

        const autoClose = await ethers.getContractFactory("LucksAutoCloseTask");
        const autoCloseAddr = (await hre.deployments.get("LucksAutoCloseTask")).address;
        LucksAutoCloseTask = await autoClose.attach(autoCloseAddr);

        const autoDraw = await ethers.getContractFactory("LucksAutoDrawTask");
        const autoDrawAddr = (await hre.deployments.get("LucksAutoDrawTask")).address;
        LucksAutoDrawTask = await autoDraw.attach(autoDrawAddr);  
        
        
        if (isTestnet()) {
            let taskNetworkAddrs = getDeploymentAddresses(getTaskNetworkNameForTest());
            acceptToken = {
                BNB: '0x0000000000000000000000000000000000000000',
                WBNB: ethers.utils.getAddress(taskNetworkAddrs["TokenWBNB"]),
                BUSD: ethers.utils.getAddress(taskNetworkAddrs["TokenBUSD"]),
                USDC: ethers.utils.getAddress(taskNetworkAddrs["TokenUSDC"]),
                USDT: ethers.utils.getAddress(taskNetworkAddrs["TokenUSDT"]),        
              };
        }
        else {
            acceptToken = acceptTokens[hre.network.name];
        }
    }
    else {
        
        const proxyCryptoPunks = await ethers.getContractFactory("ProxyCryptoPunks");
        const ProxyCryptoPunksAddr = (await hre.deployments.get("ProxyCryptoPunks")).address;
        ProxyCryptoPunks = await proxyCryptoPunks.attach(ProxyCryptoPunksAddr);   
    }

      
    return {
        contracts: {
            LucksBridge,
            LucksExecutor,
            ProxyNFTStation,
            ProxyTokenStation,
            LucksVRF,
            LucksHelper,        
            LucksGroup,
            LucksPaymentStrategy,
            LucksAutoCloseTask,
            LucksAutoDrawTask,
            ProxyCryptoPunks
        },
        acceptToken
    }
}