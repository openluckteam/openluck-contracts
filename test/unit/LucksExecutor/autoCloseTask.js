const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, getTimestamp } = require('../../helpers');

module.exports = function () {

  describe('Success cases', function () {

    function getRandomInt(max) {
      return Math.floor(Math.random() * max) + 1;
    }

    let args;
    before(async function () {
      args = await testArgs();

    });

    let start = 1;
    let end = start + 20;
    
    // for(let i=start;i<end;i++) {
    //   it(`addTask ${i}`, async function(){
    //     let { deployer, caller, contracts} = args;
    //     let endTime = getTimestamp(new Date().getTime() - 2 * 60 * 1000); // 2min
    //     await contracts.LucksAutoCloseTask.connect(deployer).addTask(i, endTime);
    //   });
    // }

    // // remove by asc
    // for(let i=start;i<end/2;i++) {
    //   it(`removeTask ${i}`, async function(){
    //     let { deployer, caller, contracts} = args;
    //     await contracts.LucksAutoCloseTask.connect(deployer).removeTask(i);
    //     let firstId = await contracts.LucksAutoCloseTask.first();
    //     let lastId = await contracts.LucksAutoCloseTask.last();
    //     let nextId = await contracts.LucksAutoCloseTask.next(firstId);
    //     let size = await contracts.LucksAutoCloseTask.size();
    //     console.log(`       size: ${size} first:${firstId} next: ${nextId} last:${lastId}`);
    //     expect(firstId).to.eq(i+1);
        
    //   });
    // }

    // remove by desc
    for(let i=end-1;i >= 0;i--) {
      it(`removeTask ${i}`, async function(){
        let { deployer, caller, contracts} = args;
        await contracts.LucksAutoCloseTask.connect(deployer).removeTask(i);
        let firstId = await contracts.LucksAutoCloseTask.first();
        let lastId = await contracts.LucksAutoCloseTask.last();
        let nextId = await contracts.LucksAutoCloseTask.next(i);
        let size = await contracts.LucksAutoCloseTask.size();
        console.log(`        size: ${size} first:${firstId} prev: ${nextId} last:${lastId}`);
        expect(lastId).to.eq(i-1);
        
      });
    }


    // it(`getQueueTasks`, async function(){
    //   let { deployer, caller, contracts} = args;
    //   let rs = await contracts.LucksAutoCloseTask.getQueueTasks();
    //   console.log(`getQueueTasks:${rs}`)
    // });

    // it(`size`, async function(){
    //   let { deployer, caller, contracts} = args;
    //   let rs = await contracts.LucksAutoCloseTask.size();
    //   console.log(`size:${rs}`)
    // });

    // it(`first`, async function(){
    //   let { deployer, caller, contracts} = args;
    //   let rs = await contracts.LucksAutoCloseTask.first();
    //   console.log(`first:${rs}`);
    //   let next = await contracts.LucksAutoCloseTask.next(rs);
    //   console.log(`next:${next}`)
    // });

  });

}