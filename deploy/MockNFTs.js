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

    console.log('DEPLOY >> deploy Mock NFTs for Tests: starting')

    const LucksExecutorBox = await ethers.getContractFactory("LucksExecutor");
    const executor = LucksExecutorBox.attach(upgradeContracts["LucksExecutor"][hre.network.name]);

    // =================== Deploy NFTS ===================

    console.log('DEPLOY >> start Deploy NFTS')
    if (isNetworkAllowTaskForTest()) { //Task Chains
        // ERC721: DoodleApes
        await deploy('DoodleApes', { from: deployer, args: [caller, 5], log: true });
        // ERC721: PandaNFT
        await deploy('PandaNFT', { from: deployer, args: [caller, 5], log: true });
        // ERC721: CyBlocPack
        await deploy('CyBlocPack', { from: deployer, args: [caller, 5], log: true });
        // ERC721: DracooMaster
        await deploy('DracooMaster', { from: deployer, args: [joiner2, 5], log: true });
        // ERC1155: WatcherMinter
        await deploy('WatcherMinter', { from: deployer, args: [], log: true });
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

        // // CryptoPunks
        // await deploy('CryptoPunksMarket', { from: deployer, args: [], log: true });

        // // EthCryptoPunks
        // await deploy('EthCryptoPunksMarket', { from: deployer, args: [], log: true });
    
    }

    console.log('DEPLOY >> done Deploy NFTS');

    // =================== Mint NFTs ===================
    if (isNetworkAllowTaskForTest()) { // Task Chains

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

module.exports.tags = ["MockNFTsForTest", "test"]
module.exports.dependencies = getDependencies()
