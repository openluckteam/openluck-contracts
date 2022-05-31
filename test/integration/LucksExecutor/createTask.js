const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { ethers } = require('hardhat');
const { testArgs, getTimestamp, getTestTitle, approvalForAllNFT, tryRevert, tryEmitCall, tryBoolQuery } = require('../../helpers');
const { getNftChainIdForTest, getTaskChainIdForTest } = require("../../../utils/network")

let testTokenId = 1;

module.exports = function () {

  describe('Success cases', function () {
    let args;
    before(async function () {

      args = await testArgs();
      let { deployer, caller, contracts, acceptToken } = args;
      let nftCount = await contracts.nfts.DoodleApes.connect(caller).totalSupply();

      if (nftCount < 1) {
        let tx = await contracts.nfts.DoodleApes.connect(deployer).mint(caller.address, 5);
        console.log("mint DoodleApes for =>> " + caller.address);
        nftCount = await contracts.nfts.DoodleApes.connect(caller).totalSupply();

      }
    });

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, caller, contracts, acceptToken } = args;
        const { arg_item } = succesTest.fn({ deployer, caller, contracts, acceptToken });
        const lzTxParams = { dstGasForCall: 550000, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }

        // approve nft first to proxy
        await approvalForAllNFT(contracts, caller, arg_item.nftContract, contracts.ProxyNFTStation.address);

        let count = await contracts.LucksExecutor.connect(caller).count();

        let ext_item = { chainId: getTaskChainIdForTest(), title: await getTestTitle(contracts, arg_item.nftContract, arg_item.tokenIds), note: "" };

        // cross chain fee
        let quoteLayerZeroFee = (await contracts.LucksBridge.quoteLayerZeroFee(ext_item.chainId, 1, ext_item.note, lzTxParams))[0];
        if (ext_item.chainId == arg_item.nftChainId) {
          quoteLayerZeroFee = 0;
        }
        console.log("           quoteLayerZeroFee: " + BigNumber.from(quoteLayerZeroFee));
        // console.log("layerZeroEndpoint: " + await contracts.LucksBridge.layerZeroEndpoint());
        console.log("           lzChainId: " + await contracts.LucksExecutor.lzChainId());

        // submit
        let tx = contracts.LucksExecutor.connect(caller).createTask(arg_item, ext_item, lzTxParams, { value: quoteLayerZeroFee });
        await tx;
        // await tryEmitCall(tx, contracts.ProxyNFTStation, "Deposit");

        let result = await contracts.LucksExecutor.connect(caller).count();

        // expect(BigNumber.from(result)).to.equal(BigNumber.from(count).add(1));
      });

    });
  });

  describe('Failure cases', function () {
    let args;
    before(async function () {
      args = await testArgs();
    });

    tests.failure.forEach(function (failureTest) {
      it(failureTest.description, async function () {

        let { caller, contracts, acceptToken } = args;
        const {
          arg_item,
          revert,
        } = failureTest.fn({ caller, contracts, acceptToken });
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }

        let ext_item = { chainId: getTaskChainIdForTest(), title: await getTestTitle(contracts, arg_item.nftContract, arg_item.tokenIds), note: "" };

        // pre check
        if (!await tryBoolQuery(contracts.LucksHelperRemote.checkNewTaskRemote(arg_item), revert)) {
          return false;
        }

        // submit
        let tx = contracts.LucksExecutor.connect(caller).createTask(arg_item, ext_item, lzTxParams, { value: 0 });
        await tryRevert(tx, revert);

      });
    });
  });
}

const tests = {
  succes: [
    {
      description: 'createTask erc721 tokenId-1 accept-BNB',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.DoodleApes.address,
          tokenIds: [testTokenId],
          tokenAmounts: [1],
          acceptToken: acceptToken.BNB,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 20 * 1000),
          endTime: getTimestamp(new Date().getTime() + 36 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,
          paymentStrategy: 0
        }
      }),
    },
    {
      description: 'createTask erc721 tokenId-2 accept-USDC',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.CyBlocPack.address,
          tokenIds: [1],
          tokenAmounts: [1],
          acceptToken: acceptToken.USDC,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 20 * 1000),
          endTime: getTimestamp(new Date().getTime() + 72 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 1
        },
      }),
    },
    {
      description: 'createTask erc721 tokenId-3 accept-USDT',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.PandaNFT.address,
          tokenIds: [3],
          tokenAmounts: [1],
          acceptToken: acceptToken.USDT,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 5 * 1000),
          endTime: getTimestamp(new Date().getTime() + 48 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 1
        },
      }),
    },
    {
      description: 'createTask erc721 tokenId-4 accept-USDT',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.CyBlocPack.address,
          tokenIds: [4],
          tokenAmounts: [1],
          acceptToken: acceptToken.USDT,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 20 * 1000),
          endTime: getTimestamp(new Date().getTime() + 36 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 0
        },
      }),
    },
    {
      description: 'createTask erc1155 tokenId-1 accept-BNB',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.WatcherMinter.address,
          tokenIds: [testTokenId],
          tokenAmounts: [10],
          acceptToken: acceptToken.BNB,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 20 * 1000),
          endTime: getTimestamp(new Date().getTime() + 72 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.001"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 0
        }
      }),
    },
    {
      description: 'createTask erc1155 tokenId-2 accept-USDC',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.WatcherMinter.address,
          tokenIds: [2],
          tokenAmounts: [10],
          acceptToken: acceptToken.USDC,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 20 * 1000),
          endTime: getTimestamp(new Date().getTime() + 24 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 0
        },
      }),
    },
    {
      description: 'createTask erc1155 tokenId-2-3 accept-USDT',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          nftChainId: getNftChainIdForTest(),
          seller: caller.address,
          nftContract: contracts.nfts.WatcherMinter.address,
          tokenIds: [2, 3],
          tokenAmounts: [10, 20],
          acceptToken: acceptToken.USDT,
          status: 1,
          startTime: getTimestamp(new Date().getTime() + 5 * 1000),
          endTime: getTimestamp(new Date().getTime() + 48 * 60 * 60 * 1000),
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),

          amountCollected: 0,
          exclusiveToken: { token: ethers.constants.AddressZero, amount: 0 },
          depositId: 0,

          paymentStrategy: 0
        },
      }),
    }
  ]
};