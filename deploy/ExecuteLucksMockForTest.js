const { utils } = require('ethers');
const { isTestnet, isLocalhost, getEndpointId, isNetworkAllowTaskForTest } = require("../utils/network")
const CONFIG = require("../constants/config.json")

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
    const executor = LucksExecutorBox.attach(CONFIG.ProxyContract[hre.network.name]);

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

    // =================== Deploy NFTS ===================

    console.log('DEPLOY >> start Deploy NFTS')
    if (isNetworkAllowTaskForTest()) { //BNBChain
        // // ERC721: DoodleApes
        // await deploy('DoodleApes', { from: deployer, args: [caller, 6], log: true });
        // // ERC721: PandaNFT
        // await deploy('PandaNFT', { from: deployer, args: [caller, 5], log: true });
        // // ERC721: CyBlocPack
        // await deploy('CyBlocPack', { from: deployer, args: [caller, 5], log: true });
        // // ERC721: DracooMaster
        // await deploy('DracooMaster', { from: deployer, args: [joiner2, 5], log: true });
        // // ERC1155: WatcherMinter
        // await deploy('WatcherMinter', { from: deployer, args: [], log: true });
    }
    else { //ETH Chain
        // // ERC721: BoredApeYachtClub
        // await deploy('EthBoredApeYachtClub', { from: deployer, args: [caller, 6], log: true });
        // // ERC721: Azuki
        // await deploy('EthAzuki', { from: deployer, args: [caller, 6], log: true });
        // // ERC721: Moonbirds
        // await deploy('EthMoonbirds', { from: deployer, args: [caller, 6], log: true });
        // // ERC721: EthOtherdeed
        // await deploy('EthOtherdeed', { from: deployer, args: [caller, 6], log: true });

        // // ERC721: EthGoblintownNFT
        // await deploy('EthGoblintownNFT', { from: deployer, args: [caller, 3], log: true });

        // // ERC721: EthMurakamiFlowers
        // await deploy('EthMurakamiFlowers', { from: deployer, args: [caller, 3], log: true });

        // // ERC721: EthShitBeast
        // await deploy('EthShitBeast', { from: deployer, args: [caller, 3], log: true });
        
        // // ERC721: EthMeebits
        // await deploy('EthMeebits', { from: deployer, args: [caller, 3], log: true });
        
        // // ERC721: EthMfers
        // await deploy('EthMfers', { from: deployer, args: [caller, 3], log: true });

        // CryptoPunks
        await deploy('CryptoPunksMarket', { from: deployer, args: [], log: true });

        // EthCryptoPunks
        await deploy('EthCryptoPunksMarket', { from: deployer, args: [], log: true });
    
    }

    console.log('DEPLOY >> done Deploy NFTS');

    // =================== Mint NFTs ===================
    if (isNetworkAllowTaskForTest()) { // BNBChain

        // mint ERC721 for joiner2
        let PandaNFT =  await (await ethers.getContract("PandaNFT")).connect(deployerSign);
        if (await PandaNFT.balanceOf(joiner2) < 1) {
            await PandaNFT.mint(joiner2, 5);
            console.log("UPDATE >> mint ERC721 PandaNFT for joiner2 finished")
        }

        // mint ERC721 for caller
        let DracooMaster =  await (await ethers.getContract("DracooMaster")).connect(deployerSign);
        if (await DracooMaster.balanceOf(caller) < 1) {
            await DracooMaster.mint(caller, 1);
            await DracooMaster.mint(caller, 2);
            await DracooMaster.mint(caller, 3);

            console.log("UPDATE >> mint ERC721 DracooMaster for caller finished")
        }

        // mint ERC1155 for caller
        let WatcherMinter =  await (await ethers.getContract("WatcherMinter")).connect(deployerSign);
        if (await WatcherMinter.balanceOf(caller, 1) < 1) {
            await WatcherMinter.mint(caller, 1, 50);
            await WatcherMinter.mint(caller, 2, 100);
            await WatcherMinter.mint(caller, 3, 200);

            console.log("UPDATE >> mint ERC1155 WatcherMinter for caller finished")
        }

        // mint ERC1155 for joiner2
        if (await WatcherMinter.balanceOf(joiner2, 1) < 1) {
            await WatcherMinter.mint(joiner2, 1, 50);
            await WatcherMinter.mint(joiner2, 2, 100);
            await WatcherMinter.mint(joiner2, 3, 200);

            console.log("UPDATE >> mint ERC1155 WatcherMinter for joiner2 finished")
        }
    }
    else {
        // ETH chain
        // mint ERC721 for target user
        // let targetUser = caller;// '0x0e5575C90b1C97740DF1C1dA9740c4b52f2A1050';

        // let EthBoredApeYachtClub =  await (await ethers.getContract("EthBoredApeYachtClub")).connect(deployerSign);
        // if (await EthBoredApeYachtClub.balanceOf(targetUser) < 1) {
        //     await EthBoredApeYachtClub.mint(targetUser, 5);
        //     console.log(`UPDATE >> mint ERC721 EthBoredApeYachtClub for ${targetUser} finished`)
        // }

        // let EthMoonbirds = await  await (ethers.getContract("EthMoonbirds")).connect(deployerSign);
        // if (await EthMoonbirds.balanceOf(targetUser) < 1) {
        //     await EthMoonbirds.mint(targetUser, 5);
        //     console.log(`UPDATE >> mint ERC721 EthMoonbirds for ${targetUser} finished`)
        // }

        // let CryptoPunksMarket = await (await ethers.getContract("CryptoPunksMarket")).connect(deployerSign);
        // if (await CryptoPunksMarket.balanceOf(targetUser) < 1) {   
        //     await CryptoPunksMarket.allInitialOwnersAssigned();         
        //     await CryptoPunksMarket.getPunk(1);
        //     await CryptoPunksMarket.transferPunk(targetUser, 1);
        //     console.log(`UPDATE >> mint CryptoPunks for ${targetUser} finished`)
        // }
    }

    // =================== Deploy Tokens ERC20 ===================
    if (isNetworkAllowTaskForTest() && isTestnet()) {
        const TokenWBNB = await deploy('TokenWBNB', { from: deployer, args: [], log: true, });
        const TokenBUSD = await deploy('TokenBUSD', { from: deployer, args: [], log: true, });
        const TokenUSDC = await deploy('TokenUSDC', { from: deployer, args: [], log: true, });
        const TokenUSDT = await deploy('TokenUSDT', { from: deployer, args: [], log: true, });

        // =================== Settings ===================

        // setting AcceptTokens
        await (lucksHelper).connect(deployerSign).setAcceptTokens(
            [
                "0x0000000000000000000000000000000000000000",
                TokenWBNB.address,
                TokenBUSD.address,
                TokenUSDC.address,
                TokenUSDT.address
            ], true
        );

        // token instances
        let tokenWBNB = await (await ethers.getContract("TokenWBNB")).connect(deployerSign);
        let tokenBUSD = await (await ethers.getContract("TokenBUSD")).connect(deployerSign);
        let tokenUSDC = await ( await ethers.getContract("TokenUSDC")).connect(deployerSign);
        let tokenUSDT = await ( await ethers.getContract("TokenUSDT")).connect(deployerSign);

        // approve Token to openluck
        await tokenWBNB.approve(executor.address, (2 ^ 256 - 1));
        await tokenBUSD.approve(executor.address, (2 ^ 256 - 1));
        await tokenUSDC.approve(executor.address, (2 ^ 256 - 1));
        await tokenUSDT.approve(executor.address, (2 ^ 256 - 1));

        // =================== Mint Tokens ERC20 ===================
        // mint token for caller
        if (await tokenBUSD.balanceOf(caller) < 1) {
            await tokenWBNB.mint(caller, utils.parseEther('10000'));
            await tokenBUSD.mint(caller, utils.parseEther('10000'));
            await tokenUSDC.mint(caller, utils.parseEther('10000'));
            await tokenUSDT.mint(caller, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for caller finished")
        }
        // mint token for joiner
        if (await tokenBUSD.balanceOf(joiner) < 1) {
            await tokenWBNB.mint(joiner, utils.parseEther('10000'));
            await tokenBUSD.mint(joiner, utils.parseEther('10000'));
            await tokenUSDC.mint(joiner, utils.parseEther('10000'));
            await tokenUSDT.mint(joiner, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for joiner finished")
        }
        // mint token for joiner2    
        if (await tokenBUSD.balanceOf(joiner2) < 1) {
            await tokenWBNB.mint(joiner2, utils.parseEther('10000'));
            await tokenBUSD.mint(joiner2, utils.parseEther('10000'));
            await tokenUSDC.mint(joiner2, utils.parseEther('10000'));
            await tokenUSDT.mint(joiner2, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for joiner2 finished")
        }
    }
}

//only deploy for chainId 31337
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
