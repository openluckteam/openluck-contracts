const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('../../helpers');
const { getTaskChainIdForTest } = require("../../../utils/network");


module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, caller, joiner, contracts, acceptToken } = args;
        const {
          arg_item
        } = succesTest.fn({ caller, acceptToken });
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }
        let ext_item = { chainId: getTaskChainIdForTest(), title: "", note: "" };

        // cross chain fee
        let quoteLayerZeroFee = 0;// (await contracts.LucksBridge.quoteLayerZeroFee(ext_item.chainId, 1, ext_item.note, lzTxParams))[0];
        if (ext_item.chainId == arg_item.nftChainId) {
          quoteLayerZeroFee = 0;
        }
        console.log("quoteLayerZeroFee: " + BigNumber.from(quoteLayerZeroFee));
        console.log("lzChainId: " + await contracts.LucksExecutor.lzChainId());

        let tx = contracts.LucksExecutor.connect(caller).claimNFTs(arg_item.taskIds, lzTxParams, { value: quoteLayerZeroFee });

        // submit
        if (!await tryCall(tx)) {
          return false;
        }

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
        } = failureTest.fn({ caller, acceptToken });
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }

        let tx = contracts.LucksExecutor.connect(caller).claimNFTs(arg_item.taskId, lzTxParams);

        // submit
        await tryRevert(tx, revert);

      });
    });
  });
}

const testTaskId = 1;
const tests = {
  succes: [
    {
      description: 'claimNFTs - task-1 erc721 tokenId-1 accept-BNB ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskIds: [1, 3],
          nftChainId: 10001
        },
      }),
    },
  ],
  failure: [
    {
      description: 'claimNFTs - Task not exists',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 88
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'claimNFTs - task-4 Not Open',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 4
        },
        revert: 'Not Open',
      }),
    },
    {
      description: 'claimNFTs - task-7 Not reach target or not expired',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 7
        },
        revert: 'Not reach target or not expired',
      }),
    }
  ]
};

