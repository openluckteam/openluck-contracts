const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('./../../helpers');
const { approveToken } = require('./../../helpers/utils');
const { isLocalhost, getTaskChainIdForTest } = require("../../../utils/network");

module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
      let { deployer, caller,joiner, contracts, acceptToken} = args;

      // await contracts.TokenUSDC.connect(deployer).mint(joiner.address, utils.parseEther('1000000'));
      // await approveToken(joiner, acceptToken.USDC, acceptToken, contracts, contracts.ProxyTokenStation.address, ethers.constants.MaxUint256);

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
    });

    it(`openTask tokenId-2 accept-USDC`, async function(){
      let { deployer, caller,joiner, contracts} = args;

      let taskId = 2;
      let task = await contracts.LucksExecutor.getTask(taskId);
      let info = await contracts.LucksExecutor.getInfo(taskId);

      console.log(`           >>> finalNo:${info.finalNo}`);

      // make sure reach targetAmount
      if (task.targetAmount > task.amountCollected) {
        console.log("         joining Task");

        let num = BigNumber.from(task.targetAmount).sub(BigNumber.from(task.targetAmount)).div(BigNumber.from(task.price));
        let tx = contracts.LucksExecutor.connect(joiner).joinTask(taskId, num, `Good Luck`);
        // submit
        if (!(await tryCall(tx, 1))) {
          console.log(`joinTask fail: ${i}`)
        }
      }

      if (task.status==1 || info.finalNo == 0) { 
        console.log("         closing Task");
        // closeTask First
        const lzTxParams = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }
        let tx = contracts.LucksExecutor.connect(caller).closeTask(taskId, lzTxParams, { value: 0 });
        // submit
        if (!await tryCall(tx)) {
          return false;
        }
      }

      if (info.finalNo ==0) {
        console.log("         callbackRandomWords Task");
        await contracts.LocalLucksVRF.connect(deployer).callbackRandomWords(taskId, info.lastTID);       
      }

      // pickwinner
      {
        console.log("         picking winner");

        const lzTxParams = { dstGasForCall: 300000, dstNativeAmount: 0, dstNativeAddr: "0x", zroPaymentAddr: "0x" }
        let ext_item = { chainId: getTaskChainIdForTest(), note: "" };
        let quoteLayerZeroFee = (await contracts.LucksBridge.quoteLayerZeroFee(ext_item.chainId, 2, ext_item.note, lzTxParams))[0];
        if (ext_item.chainId == task.nftChainId) {
          quoteLayerZeroFee = 0;
        }
        let tx = contracts.LucksExecutor.connect(caller).pickWinner(taskId, lzTxParams, { value: quoteLayerZeroFee });
        // ingore duplicate task creation error
        let error = null;
        try {
          await (await tx).wait(1);
        }
        catch (ex) {
          error = ex;
        }
      }
      
    });

  });

}