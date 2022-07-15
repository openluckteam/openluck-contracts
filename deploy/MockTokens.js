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

    console.log('DEPLOY >> deploy Mock Tokens for Tests: starting')

    const LucksExecutorBox = await ethers.getContractFactory("LucksExecutor");
    const executor = LucksExecutorBox.attach(upgradeContracts["LucksExecutor"][hre.network.name]);

    // =================== Deploy Local VRF ===================
    const lucksHelper = await ethers.getContract("LucksHelper");
    
    // =================== Deploy Tokens ERC20 ===================
    if (isNetworkAllowTaskForTest() && isTestnet()) {

        // token contract
        let TokenWETH;
        let TokenUSDC;
        let TokenUSDT;
        let TokenBUSD;        

        // token instances
        let tokenWETH;
        let tokenBUSD;
        let tokenUSDC;
        let tokenUSDT;

        if (hre.network.name.indexOf("bsc")>=0) {
            // deploy
            TokenWETH = await deploy('TokenWBNB', { from: deployer, args: [], log: true, });    
            TokenBUSD = await deploy('TokenBUSD', { from: deployer, args: [], log: true, });
           
            // instance
            tokenWETH = await (await ethers.getContract("TokenWBNB")).connect(deployerSign);
            tokenBUSD = await (await ethers.getContract("TokenBUSD")).connect(deployerSign);
        }
        else {
            TokenWETH = await deploy('TokenWETH', { from: deployer, args: [], log: true, });   
            tokenWETH = await (await ethers.getContract("TokenWETH")).connect(deployerSign);
        }
        // deploy
        TokenUSDC = await deploy('TokenUSDC', { from: deployer, args: [], log: true, });
        TokenUSDT = await deploy('TokenUSDT', { from: deployer, args: [], log: true, });
        
        // instance
        tokenUSDC = await ( await ethers.getContract("TokenUSDC")).connect(deployerSign);
        tokenUSDT = await ( await ethers.getContract("TokenUSDT")).connect(deployerSign);

        // =================== Settings ===================
        let acceptToken = [
            "0x0000000000000000000000000000000000000000",
            tokenWETH.address,
            TokenUSDC.address,
            TokenUSDT.address
        ];

        if (TokenBUSD) {
            acceptToken.push(TokenBUSD.address);
        }

        // setting AcceptTokens
        await (lucksHelper).connect(deployerSign).setAcceptTokens(
            acceptToken, true
        );

        // // approve Token to ProxyTokenStation
        // await tokenWETH.approve(executor.address, (2 ^ 256 - 1));        
        // await tokenUSDC.approve(executor.address, (2 ^ 256 - 1));
        // await tokenUSDT.approve(executor.address, (2 ^ 256 - 1));
        // if (TokenBUSD) {
        //     await tokenBUSD.approve(executor.address, (2 ^ 256 - 1));
        // }

        // =================== Mint Tokens ERC20 ===================
        // mint token for caller
        if (TokenBUSD && await tokenBUSD.balanceOf(caller) < 1) {
            await tokenWETH.mint(caller, utils.parseEther('10000'));
            await tokenBUSD.mint(caller, utils.parseEther('10000'));
            await tokenUSDC.mint(caller, utils.parseEther('10000'));
            await tokenUSDT.mint(caller, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for caller finished")
        }
        // mint token for joiner
        if (TokenBUSD && await tokenBUSD.balanceOf(joiner) < 1) {
            await tokenWETH.mint(joiner, utils.parseEther('10000'));
            await tokenBUSD.mint(joiner, utils.parseEther('10000'));
            await tokenUSDC.mint(joiner, utils.parseEther('10000'));
            await tokenUSDT.mint(joiner, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for joiner finished")
        }
        // mint token for joiner2    
        if (TokenBUSD && await tokenBUSD.balanceOf(joiner2) < 1) {
            await tokenWETH.mint(joiner2, utils.parseEther('10000'));
            await tokenBUSD.mint(joiner2, utils.parseEther('10000'));
            await tokenUSDC.mint(joiner2, utils.parseEther('10000'));
            await tokenUSDT.mint(joiner2, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for joiner2 finished")
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

module.exports.tags = ["MockTokensForTest", "test"]
module.exports.dependencies = getDependencies()
