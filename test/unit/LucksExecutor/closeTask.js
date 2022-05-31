const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('./../../helpers');
const { approveToken } = require('./../../helpers/utils'); 5
const { isLocalhost } = require("../../../utils/network");


module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    async function beforeTest(deployer, joiner, arg_item, contracts, acceptToken) {
      if (arg_item.taskId < 7) {
        arg_item.num = 103;
      }

      console.log("            >> " + utils.formatEther((await contracts.LucksExecutor.getTask(arg_item.taskId)).amountCollected));
      let tx;
      if (arg_item.acceptToken == acceptToken.BNB) {
        tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "", { value: BigNumber.from(arg_item.num).mul(arg_item.price) });
      }
      else {
        await approveToken(joiner, arg_item.acceptToken, acceptToken, contracts, contracts.ProxyTokenStation.address, BigNumber.from(arg_item.num).mul(arg_item.price));
        tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "");
      }

      // submit
      if (!await tryCall(tx)) {
        return false;
      }

      if (isLocalhost() && (await contracts.LucksHelper.getVRF()) != contracts.LocalLucksVRF.address) {
        await contracts.LucksHelper.connect(deployer).setVRF(contracts.LocalLucksVRF.address);
        console.log("          > reset LocalLucksVRF");
      }
    };

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, caller, joiner, contracts, acceptToken } = args;
        const {
          arg_item
        } = succesTest.fn({ caller, acceptToken });
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }

        // await beforeTest(deployer, joiner, arg_item, contracts, acceptToken);

        console.log(`           VRF: ${await contracts.LucksHelper.getVRF()}`)

        let tx = contracts.LucksExecutor.connect(caller).closeTask(arg_item.taskId, lzTxParams, { value: 0 });

        // submit
        if (!await tryCall(tx)) {
          return false;
        }

        let item = await contracts.LucksExecutor.getTask(arg_item.taskId);
        let status = item.status;
        console.log("            >>> " + utils.formatEther(item.amountCollected));
        expect(BigNumber.from(status)).to.equal(BigNumber.from(2));

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
        let tx = contracts.LucksExecutor.connect(caller).closeTask(arg_item.taskId, lzTxParams);

        // submit
        await tryRevert(tx, revert);

      });
    });
  });
}

const testTaskId = 799;
const tests = {
  succes: [
    {
      description: 'closeTask - task-1 erc721 tokenId-1 accept-BNB ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          acceptToken: acceptToken.BNB,
          price: utils.parseEther("0.01")
        },
      }),
    },
    {
      description: 'closeTask - task-2 erc721 tokenId-2 accept-USDC ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          acceptToken: acceptToken.USDC,
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'closeTask - task-3 erc721 tokenId-3 accept-USDT ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 3,
          acceptToken: acceptToken.USDT,
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'closeTask - task-4 erc721 tokenId-4 accept-USDT',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 4,
          acceptToken: acceptToken.USDT,
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'closeTask - task-5 erc1155 tokenId-1 accept-BNB',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 5,
          acceptToken: acceptToken.BNB,
          price: utils.parseEther("0.001"),
        },
      }),
    },
    {
      description: 'closeTask - task-6 erc1155 tokenId-2 accept-USDC',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 6,
          acceptToken: acceptToken.USDC,
          price: utils.parseEther("0.1"),
        },
      }),
    },
  ],
  failure: [
    {
      description: 'closeTask - Task not exists',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 88
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'closeTask - task-4 Not Open',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 4
        },
        revert: 'Not Open',
      }),
    },
    {
      description: 'closeTask - task-7 Not reach target or not expired',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 7
        },
        revert: 'Not reach target or not expired',
      }),
    }
  ]
};

