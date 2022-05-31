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
        // ERC721: DoodleApes
        const DoodleApes = await deploy('DoodleApes', { from: deployer, args: [caller, 6], log: true });
        // ERC721: PandaNFT
        const PandaNFT = await deploy('PandaNFT', { from: deployer, args: [caller, 5], log: true });
        // ERC721: CyBlocPack
        const CyBlocPack = await deploy('CyBlocPack', { from: deployer, args: [caller, 5], log: true });
        // ERC721: DracooMaster
        const DracooMaster = await deploy('DracooMaster', { from: deployer, args: [joiner2, 5], log: true });
        // ERC1155: WatcherMinter
        const WatcherMinter = await deploy('WatcherMinter', { from: deployer, args: [], log: true });
    }
    else { //ETH Chain
        // ERC721: BoredApeYachtClub
        const EthBoredApeYachtClub = await deploy('EthBoredApeYachtClub', { from: deployer, args: [caller, 6], log: true });
        // ERC721: Azuki
        const EthAzuki = await deploy('EthAzuki', { from: deployer, args: [caller, 6], log: true });
        // ERC721: Moonbirds
        const EthMoonbirds = await deploy('EthMoonbirds', { from: deployer, args: [caller, 6], log: true });
        // ERC721: EthOtherdeed
        const EthOtherdeed = await deploy('EthOtherdeed', { from: deployer, args: [caller, 6], log: true });

    }

    console.log('DEPLOY >> done Deploy NFTS');

    // =================== Mint NFTs ===================
    if (isNetworkAllowTaskForTest()) { // BNBChain
        // mint ERC721 for joiner2
        if (await (await ethers.getContract("PandaNFT")).connect(deployerSign).balanceOf(joiner2) < 1) {
            await (await ethers.getContract("PandaNFT")).connect(deployerSign).mint(joiner2, 5);
            console.log("UPDATE >> mint ERC721 PandaNFT for joiner2 finished")
        }

        // mint ERC721 for caller
        if (await (await ethers.getContract("DracooMaster")).connect(deployerSign).balanceOf(caller) < 1) {
            await (await ethers.getContract("DracooMaster")).connect(deployerSign).mint(caller, 1);
            await (await ethers.getContract("DracooMaster")).connect(deployerSign).mint(caller, 2);
            await (await ethers.getContract("DracooMaster")).connect(deployerSign).mint(caller, 3);

            console.log("UPDATE >> mint ERC721 DracooMaster for caller finished")
        }

        // mint ERC1155 for caller
        if (await (await ethers.getContract("WatcherMinter")).connect(deployerSign).balanceOf(caller, 1) < 1) {
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(caller, 1, 50);
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(caller, 2, 100);
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(caller, 3, 200);

            console.log("UPDATE >> mint ERC1155 WatcherMinter for caller finished")
        }

        // mint ERC1155 for joiner2
        if (await (await ethers.getContract("WatcherMinter")).connect(deployerSign).balanceOf(joiner2, 1) < 1) {
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(joiner2, 1, 50);
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(joiner2, 2, 100);
            await (await ethers.getContract("WatcherMinter")).connect(deployerSign).mint(joiner2, 3, 200);

            console.log("UPDATE >> mint ERC1155 WatcherMinter for joiner2 finished")
        }
    }
    else {
        // ETH chain
        // mint ERC721 for target user
        let targetUser = '0x0e5575C90b1C97740DF1C1dA9740c4b52f2A1050';
        if (await (await ethers.getContract("EthBoredApeYachtClub")).connect(deployerSign).balanceOf(targetUser) < 1) {
            await (await ethers.getContract("EthBoredApeYachtClub")).connect(deployerSign).mint(targetUser, 5);
            console.log(`UPDATE >> mint ERC721 EthBoredApeYachtClub for ${targetUser} finished`)
        }
        if (await (await ethers.getContract("EthMoonbirds")).connect(deployerSign).balanceOf(targetUser) < 1) {
            await (await ethers.getContract("EthMoonbirds")).connect(deployerSign).mint(targetUser, 5);
            console.log(`UPDATE >> mint ERC721 EthMoonbirds for ${targetUser} finished`)
        }
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

        // approve Token to openluck
        await (await ethers.getContract("TokenWBNB")).connect(deployerSign).approve(executor.address, (2 ^ 256 - 1));
        await (await ethers.getContract("TokenBUSD")).connect(deployerSign).approve(executor.address, (2 ^ 256 - 1));
        await (await ethers.getContract("TokenUSDC")).connect(deployerSign).approve(executor.address, (2 ^ 256 - 1));
        await (await ethers.getContract("TokenUSDT")).connect(deployerSign).approve(executor.address, (2 ^ 256 - 1));

        // =================== Mint Tokens ERC20 ===================
        // mint token for caller
        if (await (await ethers.getContract("TokenBUSD")).connect(deployerSign).balanceOf(caller) < 1) {
            await (await ethers.getContract("TokenWBNB")).connect(deployerSign).mint(caller, utils.parseEther('10000'));
            await (await ethers.getContract("TokenBUSD")).connect(deployerSign).mint(caller, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDC")).connect(deployerSign).mint(caller, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDT")).connect(deployerSign).mint(caller, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for caller finished")
        }
        // mint token for joiner
        if (await (await ethers.getContract("TokenBUSD")).connect(deployerSign).balanceOf(joiner) < 1) {
            await (await ethers.getContract("TokenWBNB")).connect(deployerSign).mint(joiner, utils.parseEther('10000'));
            await (await ethers.getContract("TokenBUSD")).connect(deployerSign).mint(joiner, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDC")).connect(deployerSign).mint(joiner, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDT")).connect(deployerSign).mint(joiner, utils.parseEther('10000'));

            console.log("UPDATE >> mint ERC20 for joiner finished")
        }
        // mint token for joiner2    
        if (await (await ethers.getContract("TokenBUSD")).connect(deployerSign).balanceOf(joiner2) < 1) {
            await (await ethers.getContract("TokenWBNB")).connect(deployerSign).mint(joiner2, utils.parseEther('10000'));
            await (await ethers.getContract("TokenBUSD")).connect(deployerSign).mint(joiner2, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDC")).connect(deployerSign).mint(joiner2, utils.parseEther('10000'));
            await (await ethers.getContract("TokenUSDT")).connect(deployerSign).mint(joiner2, utils.parseEther('10000'));

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
