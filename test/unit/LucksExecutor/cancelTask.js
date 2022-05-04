const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, getTestTitle, tryRevert, tryCall } = require('../../helpers');
const {
  getNftChainIdForTest,
  getTaskChainIdForTest
} = require("../../../utils/network");

let testTokenId = 1;

module.exports = async function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { caller, contracts, acceptToken } = args;
        const { arg_item } = succesTest.fn({ caller, contracts, acceptToken });
        const lzTxParams = { dstGasForCall: 450000, dstNativeAmount: 0, dstNativeAddr: "0x" }
        
        let ext_item = { chainId: getTaskChainIdForTest(), title: await getTestTitle(contracts, arg_item.nftContract, arg_item.tokenIds), note: "" };

        let item1 = await contracts.LucksExecutor.getTask(arg_item.taskId);
        let status1 = item1.status;
        console.log(`      status:${status1}`);
        if (status1 == 5){
          return true;
        }

        console.log(ext_item.chainId + "|" + arg_item.nftChainId )
        let quoteLayerZeroFee = (await contracts.LucksBridge.quoteLayerZeroFee(ext_item.chainId, 2, ext_item.note, lzTxParams))[0];      
        if (ext_item.chainId == arg_item.nftChainId) {
          quoteLayerZeroFee = 0;
        }
        console.log("quoteLayerZeroFee: " + BigNumber.from(quoteLayerZeroFee));

        let tx = contracts.LucksExecutor.connect(caller).cancelTask(arg_item.taskId, lzTxParams, {value:quoteLayerZeroFee});
       
        // submit
        if (!await tryCall(tx)){
          return false;
        }
       
        let item = await contracts.LucksExecutor.getTask(arg_item.taskId);
        let status = item.status;
        expect(BigNumber.from(status)).to.equal(BigNumber.from(5));

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
        const { arg_item,revert } = failureTest.fn({ caller, contracts, acceptToken });
        const lzTxParams = { dstGasForCall: 200000, dstNativeAmount: 0, dstNativeAddr: "0x" }
        let quoteLayerZeroFee = 0;
        let tx = contracts.LucksExecutor.connect(caller).cancelTask(arg_item.taskId, lzTxParams,{value:quoteLayerZeroFee});
        
        // submit
        await tryRevert(tx, revert);

      });
    });
  });
}

const tests = {
  succes: [
    {
      description: 'cancelTask tokenId-1 ',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          taskId: 4,
          nftChainId: 10001,
          seller: caller.address,
          nftContract: contracts.nfts.DoodleApes.address,
          tokenIds: [testTokenId],
          tokenAmounts: [1],
          acceptToken: acceptToken.BNB
        },
      }),
    }
  ],
  failure: [
    {
      description: 'cancelTask - Task not exists',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          taskId: 999,
          num: 2,
          buyer: caller.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("100"),
          price: utils.parseEther("1"),
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'cancelTask - task-1 Opening or canceled',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          taskId: 1,
          num: 0,
          buyer: caller.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("100"),
          price: utils.parseEther("0.01"),
        },
        revert: 'Opening or canceled',
      }),
    },
    {
      description: 'cancelTask - task-2 Opening or canceled',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          num: 0,
          buyer: caller.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("100"),
          price: utils.parseEther("0.01"),
        },
        revert: 'Opening or canceled',
      }),
    },
    {
      description: 'cancelTask - task-3 Opening or canceled',
      fn: ({ caller, contracts, acceptToken }) => ({
        arg_item: {
          taskId: 3,
          num: 0,
          buyer: caller.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("100"),
          price: utils.parseEther("0.01"),
        },
        revert: 'Opening or canceled',
      }),
    }
  ]
};
