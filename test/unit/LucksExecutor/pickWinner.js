const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { testArgs } = require('./../../helpers');
const { isLocalhost, getTaskChainIdForTest } = require("../../../utils/network");

const testTaskId = 1;
module.exports = async function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    async function beforeTest(test, contracts, caller, deployer) {
      const viewRandomResult = await contracts.LucksVRF.viewRandomResult(testTaskId);
      console.log(`     viewRandomResult:${viewRandomResult}`);
      if (viewRandomResult > 0)
        return;
      // // let tx = await contracts.LocalLucksVRF.connect(deployer).callbackRandomWords(arg_item.taskId, arg_item.max);
      // let tx = await contracts.LucksVRF.connect(deployer).callbackRandomWords(testTaskId, BigNumber.from("34800912403884208594052492108196706391120962947295887170644587722550761437559"));
      // console.log(tx);

      if (isLocalhost()) {
        if ((await contracts.LucksExecutor.HELPER()) != contracts.LucksHelper.address) {
          await contracts.LucksExecutor.connect(deployer).setLucksHelper(contracts.LucksHelper.address);
          console.log("          > reset LucksHelper");
        }
        if ((await contracts.LucksHelper.getVRF()) != contracts.LocalLucksVRF.address) {
          await contracts.LucksHelper.connect(deployer).setVRF(contracts.LocalLucksVRF.address);
          console.log("          > reset LocalLucksVRF");
        }
      }
    };

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, caller, contracts, acceptToken } = args;
        const {
          arg_item
        } = succesTest.fn();

        await beforeTest(succesTest, contracts, caller, deployer);

        const viewRandomResult = await contracts.LucksVRF.viewRandomResult(arg_item.taskId);

        let item1 = await contracts.LucksExecutor.getTask(arg_item.taskId);
        if (item1.status == 3) {

          let winNumber = await contracts.LucksExecutor.winTickets(arg_item.taskId);
          console.log(`           >>> opened:${winNumber}  viewRandomResult:${viewRandomResult}`);
          return true;
        }
        else {
          console.log('           >>> viewRandomResult ' + viewRandomResult)
        }

        const lzTxParams = { dstGasForCall: 300000, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }
        let ext_item = { chainId: getTaskChainIdForTest(), note: "" };

        console.log(ext_item.chainId + "|" + arg_item.nftChainId)
        let quoteLayerZeroFee = (await contracts.LucksBridge.quoteLayerZeroFee(ext_item.chainId, 2, ext_item.note, lzTxParams))[0];
        if (ext_item.chainId == arg_item.nftChainId) {
          quoteLayerZeroFee = 0;
        }
        console.log("quoteLayerZeroFee: " + BigNumber.from(quoteLayerZeroFee));
        console.log(arg_item);
        let tx = contracts.LucksExecutor.connect(caller).pickWinner(arg_item.taskId, lzTxParams, { value: quoteLayerZeroFee });
        // ingore duplicate task creation error
        let error = null;
        try {
          await (await tx).wait(1);
        }
        catch (ex) {
          error = ex;
        }

        if (error) {
          console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
          return true;
        }

        let item = await contracts.LucksExecutor.getTask(arg_item.taskId);
        let status = item.status;

        expect(BigNumber.from(status)).to.equal(BigNumber.from(3));

      });
    });
  });

  describe('Failure cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    async function beforeTest(test, contracts, caller, deployer) {
      if (test.description == "pickWinner - task-2 Delay limit") {
        await contracts.LucksHelper.connect(deployer).setDrawDelay(6000000);
      }

      if (test.description == "pickWinner - task-2 Not Drawn") {
        // set to wrong vrf
        await contracts.LucksHelper.connect(deployer).setDrawDelay(0);
        await contracts.LucksExecutor.connect(deployer).setLucksHelper(contracts.LucksVRF.address);
      }
    };

    async function afterTest(test, contracts, caller, deployer) {
      if (test.description == "pickWinner - task-2 Delay limit") {
        await contracts.LucksHelper.connect(deployer).setDrawDelay(0);
      }

      if (test.description == "pickWinner - task-2 Not Drawn") {
        // set back to right vrf
        await contracts.LucksExecutor.connect(deployer).setLucksHelper(contracts.LocalLucksVRF.address);
      }
    };

    tests.failure.forEach(function (failureTest) {
      it(failureTest.description, async function () {

        let { deployer, caller, contracts, acceptToken } = args;
        const {
          arg_item,
          revert,
        } = failureTest.fn();
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }
        await beforeTest(failureTest, contracts, caller, deployer);
        console.log('        >>> viewRandomResult ' + await contracts.LocalLucksVRF.viewRandomResult(arg_item.taskId))
        let tx = contracts.LucksExecutor.connect(caller).pickWinner(arg_item.taskId, lzTxParams);

        // ingore duplicate task creation error
        let error = null;
        try {
          await expect(tx).to.be.revertedWith(revert);
        } catch (ex) {
          error = ex;
        }
        if (error) {
          console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
          return true;
        }

        await afterTest(failureTest, contracts, caller, deployer);
      });
    });
  });
}

const tests = {
  succes: [
    {
      description: 'pickWinner - task-1 erc721 tokenId-1 accept-BNB ',
      fn: () => ({
        arg_item: {
          taskId: testTaskId,
          nftChainId: 10001
        },
      }),
    },
    {
      description: 'pickWinner - task-2 erc721 tokenId-2 accept-USDC ',
      fn: () => ({
        arg_item: {
          taskId: 2
        },
      }),
    },
    {
      description: 'pickWinner - task-3 erc721 tokenId-3 accept-USDT ',
      fn: () => ({
        arg_item: {
          taskId: 3
        },
      }),
    },
    {
      description: 'pickWinner - task-4 erc721 tokenId-4 accept-USDT',
      fn: () => ({
        arg_item: {
          taskId: 4
        },
      }),
    },
    {
      description: 'pickWinner - task-5 erc1155 tokenId-1 accept-BNB',
      fn: () => ({
        arg_item: {
          taskId: 5
        },
      }),
    },
    {
      description: 'pickWinner - task-6 erc1155 tokenId-2 accept-USDC',
      fn: () => ({
        arg_item: {
          taskId: 6
        },
      }),
    },
  ],
  failure: [
    {
      description: 'pickWinner - task-8 Task not exists',
      fn: () => ({
        arg_item: {
          taskId: 88
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'pickWinner - task-7 Not Close',
      fn: () => ({
        arg_item: {
          taskId: 7
        },
        revert: 'Not Close',
      }),
    },
    {
      description: 'pickWinner - task-2 Delay limit',
      fn: () => ({
        arg_item: {
          taskId: 2
        },
        revert: 'Delay limit',
      }),
    },
    {
      description: 'pickWinner - task-2 Not Drawn',
      fn: () => ({
        arg_item: {
          taskId: 2
        },
        revert: 'Not Drawn',
      }),
    },
    {
      description: "pickWinner - task-2 Lost winner",
      fn: () => ({
        arg_item: {
          taskId: 2
        },
        revert: "Lost winner",
      }),
    }
  ]
};

