const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, getTimestamp } = require('../../helpers');

module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    let start = 1;
    let end = start + 1000;
    
    for(let i=start;i<end;i++) {
      it(`addTask ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        let endTime = getTimestamp(new Date().getTime() - 2 * 60 * 1000); // 2min
        await contracts.LucksAutoCloseTask.connect(deployer).addTask(i, endTime);
      });
    }

    for(let i=end;i<end+2000;i++) {
      it(`addTask ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        let endTime = getTimestamp(new Date().getTime() + 18 * 60 * 60 * 1000); // 2min
        await contracts.LucksAutoCloseTask.connect(deployer).addTask(i, endTime);
      });
    }

    it(`getQueueTasks`, async function(){
      let { deployer, caller, contracts} = args;
      let rs = await contracts.LucksAutoCloseTask.getQueueTasks();
      console.log(`getQueueTasks:${rs}`)
    });

    it(`size`, async function(){
      let { deployer, caller, contracts} = args;
      let rs = await contracts.LucksAutoCloseTask.size();
      console.log(`size:${rs}`)
    });

    it(`first`, async function(){
      let { deployer, caller, contracts} = args;
      let rs = await contracts.LucksAutoCloseTask.first();
      console.log(`first:${rs}`);
      let next = await contracts.LucksAutoCloseTask.next(rs);
      console.log(`next:${next}`)
    });

  });

}