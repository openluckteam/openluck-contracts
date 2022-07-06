const { expect } = require("chai");
const { BigNumber, Contract } = require("ethers");
const { ethers } = require('hardhat');
const { getMetaData, formatIpfsUrl } = require("./ipfs")
const { getDeploymentAddresses } = require("../../utils/readDeployments")
const {
  getTaskNetworkNameForTest, isNetworkAllowTaskForTest, isLocalhost, isTestnet
} = require("../../utils/network")
const CONFIG = require("../../constants/config.json")
const upgradeContracts = require("../../constants/upgradeContracts.json")

this.getTimestamp = function (timestampms) {
  timestampms = timestampms || Date.now();
  return Math.floor(timestampms / 1000);
}


this.testArgs = async function () {

  let [deployer, caller, joiner, joiner2] = await ethers.getSigners();

  let taskNetworkAddrs = getDeploymentAddresses(getTaskNetworkNameForTest());
  // console.log(taskNetworkAddrs)
  const acceptToken = {
    BNB: '0x0000000000000000000000000000000000000000',
    BUSD: ethers.utils.getAddress(taskNetworkAddrs["TokenBUSD"]),
    USDC: ethers.utils.getAddress(taskNetworkAddrs["TokenUSDC"]),
    USDT: ethers.utils.getAddress(taskNetworkAddrs["TokenUSDT"]),
    SHIB: '0x2859e4544c4bb03966803b044a93563bd2d0dd4d' //unsupport
  }

  const code = await ethers.getContractFactory("LucksExecutor");        
  const LucksExecutor = code.attach(upgradeContracts["LucksExecutor"][hre.network.name]);
  const LucksBridge = await ethers.getContract("LucksBridge");  
  const ProxyNFTStation = await ethers.getContract("ProxyNFTStation");
  const LucksHelper = await ethers.getContract("LucksHelper");
  const LucksHelperRemote = await (await ethers.getContractFactory("LucksHelper")).attach(
    ethers.utils.getAddress(taskNetworkAddrs["LucksHelper"]));

  const ProxyTokenStation = isNetworkAllowTaskForTest() ? await ethers.getContract("ProxyTokenStation") : ethers.constants.AddressZero;
  const LucksVRF = isNetworkAllowTaskForTest() ? await ethers.getContract("LucksVRF") : ethers.constants.AddressZero;
  const LocalLucksVRF = isNetworkAllowTaskForTest() && isLocalhost() ? await ethers.getContract("LocalLucksVRF") : ethers.constants.AddressZero;

  const codeLucksGroup = await ethers.getContractFactory("LucksGroup"); 
  const LucksGroup = isNetworkAllowTaskForTest() ? codeLucksGroup.attach(upgradeContracts["LucksGroup"][hre.network.name]) : ethers.constants.AddressZero;
  
  const LucksAutoCloseTask = isNetworkAllowTaskForTest() ? await ethers.getContract("LucksAutoCloseTask") : ethers.constants.AddressZero;
  const LucksAutoDrawTask = isNetworkAllowTaskForTest() ? await ethers.getContract("LucksAutoDrawTask") : ethers.constants.AddressZero;
  const TokenPrices = isNetworkAllowTaskForTest() ? await ethers.getContract("TokenPrices") : ethers.constants.AddressZero;

  const TokenBUSD = await (await ethers.getContractFactory("TokenBUSD")).attach(acceptToken.BUSD);
  const TokenUSDC = await (await ethers.getContractFactory("TokenUSDC")).attach(acceptToken.USDC);
  const TokenUSDT = await (await ethers.getContractFactory("TokenUSDT")).attach(acceptToken.USDT);

  hre.tracer.nameTags[LucksExecutor.address] = "LucksExecutor";
  hre.tracer.nameTags[ProxyNFTStation.address] = "ProxyNFTStation";
  hre.tracer.nameTags[LucksHelper.address] = "LucksHelper";
  if (isNetworkAllowTaskForTest()) {
    hre.tracer.nameTags[ProxyTokenStation.address] = "ProxyTokenStation";
    hre.tracer.nameTags[LocalLucksVRF.address] = "LocalLucksVRF";
    hre.tracer.nameTags[LucksVRF.address] = "LucksVRF";
    hre.tracer.nameTags[LucksGroup.address] = "LucksGroup";
  }

  const EthBoredApeYachtClub = isNetworkAllowTaskForTest() ? ethers.constants.AddressZero : await ethers.getContract("EthBoredApeYachtClub");
  const EthMoonbirds = isNetworkAllowTaskForTest() ? ethers.constants.AddressZero : await ethers.getContract("EthMoonbirds");
  const EthAzuki = isNetworkAllowTaskForTest() ? ethers.constants.AddressZero : await ethers.getContract("EthAzuki");
  const CryptoPunks = isNetworkAllowTaskForTest() ? ethers.constants.AddressZero : await ethers.getContract("CryptoPunksMarket");
  const ProxyCryptoPunks = isNetworkAllowTaskForTest() ? ethers.constants.AddressZero : await ethers.getContract("ProxyCryptoPunks");

  const CyBlocPack = isNetworkAllowTaskForTest() ? await ethers.getContract("CyBlocPack") : ethers.constants.AddressZero;
  const PandaNFT = isNetworkAllowTaskForTest() ? await ethers.getContract("PandaNFT") : ethers.constants.AddressZero;
  const DoodleApes = isNetworkAllowTaskForTest() ? await ethers.getContract("DoodleApes") : ethers.constants.AddressZero;
  const DracooMaster = isNetworkAllowTaskForTest() ? await ethers.getContract("DracooMaster") : ethers.constants.AddressZero;
  const WatcherMinter = isNetworkAllowTaskForTest() ? await ethers.getContract("WatcherMinter") : ethers.constants.AddressZero;

  return {
    deployer,
    caller,
    joiner,
    joiner2,
    contracts: {
      LucksBridge,
      LucksExecutor,
      ProxyNFTStation,
      ProxyTokenStation,
      ProxyCryptoPunks,
      LucksVRF,
      LocalLucksVRF,
      LucksHelper,
      LucksHelperRemote,
      LucksGroup,
      LucksAutoCloseTask,
      LucksAutoDrawTask,
      TokenPrices,
      nfts: {
        DoodleApes,
        CyBlocPack,
        PandaNFT,
        DracooMaster,
        WatcherMinter,
        EthAzuki,
        EthBoredApeYachtClub,
        EthMoonbirds,
        CryptoPunks
      },
      TokenBUSD,
      TokenUSDC,
      TokenUSDT
    },
    acceptToken
  };
};


function getNftContract(contracts, address) {
  let contract;
  switch (address) {
    case contracts.nfts.CyBlocPack.address:
      contract = contracts.nfts.CyBlocPack;
      break;
    case contracts.nfts.PandaNFT.address:
      contract = contracts.nfts.PandaNFT;
      break;
    case contracts.nfts.DoodleApes.address:
      contract = contracts.nfts.DoodleApes;
      break;
    case contracts.nfts.WatcherMinter.address:
      contract = contracts.nfts.WatcherMinter;
      break;
    case contracts.nfts.DracooMaster.address:
      contract = contracts.nfts.DracooMaster;
      break;
    case contracts.nfts.EthAzuki.address:
      contract = contracts.nfts.EthAzuki;
      break;
    case contracts.nfts.EthBoredApeYachtClub.address:
      contract = contracts.nfts.EthBoredApeYachtClub;
      break;
    case contracts.nfts.EthMoonbirds.address:
      contract = contracts.nfts.EthMoonbirds;
      break;
    case contracts.nfts.CryptoPunks.address:
        contract = contracts.nfts.CryptoPunks;
        break;
      case contracts.nfts.EthCryptoPunks.address:
        contract = contracts.nfts.EthCryptoPunks;
        break;
  }

  return contract;
}

this.approvalForAllNFT = async function (contracts, caller, nftContract, to) {

  if (nftContract == contracts.nfts.CryptoPunks.address) {
    return;
  }
  let contract = await getNftContract(contracts, nftContract).connect(caller);

  if (!await contract.isApprovedForAll(caller.address, to)) {

    console.log("                setApprovalForAll: " + await contract.name());
    await contract.setApprovalForAll(to, true);
  }
}

this.getTestTitle = async function (contracts, nftContract, tokenIds) {

  return "";
  let contract = getNftContract(contracts, nftContract);

  if (contract) {
    let name = await contract.name();
    let symbol = await contract.symbol();

    let title = name;
    for (let tokenId of tokenIds) {
      title += " #" + tokenId;
    }
    return title + " (" + symbol + ")";
  }
  return '';
}

this.getTaskItemExt = async function (contracts, nftContract, tokenId) {

  let name = await getNftContract(contracts, nftContract).name();

  let tokenURI = await getNftContract(contracts, nftContract).tokenURI(tokenId);
  let meta = await getMetaData(tokenURI);
  return {
    name,
    tokenURI,
    image: formatIpfsUrl(meta["image"]),
    note: ""
  };
}

function getError(error) {
  let str;
  if (error) {
    let message = error.reason || error.message;
    if (!message) {
      message = error.data;
    }
    str = (`            message: ${message} | hash: ${error.transactionHash} | code: ${error.code} > ${Object.keys(error)}`);
  }
  return str;
}

function printError(error) {
  let message = getError(error);
  if (message) {
    console.log(message);
  }
}

this.tryRevert = async (tx, revert) => {
  let error;
  try {
    await expect(tx).to.be.revertedWith(revert);
    return true;
  }
  catch (ex) {
    error = ex;
  }
  printError(error);
  return false;
}

this.tryBoolQuery = async (tx, revert) => {
  let error;
  try {
    return await tx;
  }
  catch (ex) {
    error = ex;
  }

  if (error && revert && getError(error).toString().includes(revert)) {
    return true;
  }

  printError(error);
  return false;
}

this.tryCall = async (tx, wait = 0) => {
  let error;
  try {
    if (wait==0) {
      (await tx);
    }else {
      await (await tx).wait(wait);
    }
    
    return true;
  }
  catch (ex) {
    error = ex;
  }
  printError(error);
  return false;
}

this.tryEmitCall = async (tx, contract, event) => {
  let error;
  try {    
    // await (await tx).wait();
    expect(await tx).to.emit(contract, event);
  }
  catch (ex) {
    error = ex;
    console.log(`tx: ${tx}`)
  }
  printError(error);
}

module.exports = this;