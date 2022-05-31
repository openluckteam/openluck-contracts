const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { ethers } = require('hardhat');
const { testArgs, tryRevert, tryCall } = require('./../../helpers');
const { approveToken } = require('./../../helpers/utils');

module.exports = function () {

  describe('Success cases', function () {

    function getRandomInt(max) {
      return Math.floor(Math.random() * max) + 1;
    }

    let args;
    before(async function () {
      args = await testArgs();
      let { deployer, caller,joiner, joiner2, contracts, acceptToken} = args;

      await contracts.TokenUSDC.connect(deployer).mint(joiner2.address, utils.parseEther('10000000'));
      await approveToken(joiner2, acceptToken.USDC, acceptToken, contracts, contracts.ProxyTokenStation.address, ethers.constants.MaxUint256);

      // let task = await contracts.LucksExecutor.getTask(2);
    });

    let start = 117;
    let end = start + 100;
    let taskId = 7;
    let instance1=null;
    let instance2=null;

    for(let i=start;i<end;i++) {
      let num = getRandomInt(500);
      it(`joinTask tokenId-7 accept-USDC joiner ${i}, num:${num}`, async function(){

        let { deployer, caller,joiner, joiner2, contracts} = args;   

        if (!instance1) {
          instance1 = contracts.LucksExecutor.connect(joiner);
        }
        if (!instance2) {
          instance2 = contracts.LucksExecutor.connect(joiner2);
        }
         
        let tx = instance1.joinTask(taskId, num, `Good Luck to ${i}-${num}`);
        if (i%2==0) {
          tx = instance2.joinTask(taskId, num, `Good Luck to ${i}-${num}`);
        }
        // submit
        if (!(await tryCall(tx, 0))) {
           console.log(`joinTask fail: ${i}`)
        }
      });
    }  

  });

}