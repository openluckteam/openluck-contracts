const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, getTimestamp } = require('../../helpers');

module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    for(let i=1;i<20;i++) {
      it(`addTicket - tree ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        await contracts.TestTicket.connect(deployer).addTicket(1, 1, 10, caller.address);
      });
    }

    for(let i=1;i<20;i++) {
      it(`addTicket2 - no tree ${i}`, async function(){
        let { deployer, caller, contracts} = args;      
        await contracts.TestTicket.connect(deployer).addTicket2(1, 1, 10, caller.address);
      });
    }

    for(let i=1;i<10;i++) {
      it(`findWinnerTicket - tree ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        let rs = await contracts.TestTicket.findWinnerTicket(1, i*8);
        console.log(`find:${i*8} rs:${rs}`)
      });
    }

    for(let i=1;i<10;i++) {
      it(`findWinnerTicket2 - bst ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        let rs = await contracts.TestTicket.findWinnerTicket2(1, i*8);
        console.log(`find:${i*8} rs:${rs}`)
      });
    }

    // it(`testFind - for loop 5000`, async function(){
    //   let { deployer, caller, contracts} = args;
    //   let rs = await contracts.TestTicket.testFind(20000);
    // });

    // it(`testFind2 - for loop 5000`, async function(){
    //   let { deployer, caller, contracts} = args;
    //   let rs = await contracts.TestTicket.testFind2(5000);
    // });
  });

}