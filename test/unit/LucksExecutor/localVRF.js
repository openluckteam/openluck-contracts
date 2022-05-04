const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('./../../helpers');

module.exports = async function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    async function beforeTest(test, contracts, arg_item, deployer) {

      let finalNumber = await contracts.LocalLucksVRF.viewRandomResult(arg_item.taskId);
      console.log("           prev finalNumber:" + finalNumber);

      await contracts.LocalLucksVRF.connect(deployer).setAutoPickWinner(arg_item.autoPick);

      if (finalNumber < 1 || (!arg_item.random && finalNumber != arg_item.max) ||
        (arg_item.random && finalNumber > arg_item.max)) {
        await contracts.LocalLucksVRF.connect(deployer).reqRandomNumber(arg_item.taskId, arg_item.max);
        console.log("           reqRandomNumber:" + test.description);
      }
    };

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, contracts, acceptToken } = args;
        const {
          arg_item
        } = succesTest.fn();
        
        await beforeTest(succesTest, contracts, arg_item, deployer);

        if (arg_item.random) {

          let tx = contracts.LocalLucksVRF.connect(deployer).callbackRandomWords(arg_item.taskId, arg_item.max);
          // ingore duplicate task creation error
          let error = null; 
          try {
            await (await tx).wait();
          }
          catch(ex) {
            error = ex;
          }
  
          if (error) {
            console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
            return true;
          }
                            
          let finalNumber = await contracts.LocalLucksVRF.connect(deployer).viewRandomResult(arg_item.taskId);

          expect(finalNumber).to.greaterThan(0);
        }
        else {
          let tx = contracts.LocalLucksVRF.connect(deployer).callbackTestRandomWords(arg_item.taskId, arg_item.max);
          // ingore duplicate task creation error
          let error = null; 
          try {
            await (await tx).wait();
          }
          catch(ex) {
            error = ex;
          }
  
          if (error) {
            console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
            return true;
          }
          
          let finalNumber = await contracts.LocalLucksVRF.connect(deployer).viewRandomResult(arg_item.taskId);

          expect(finalNumber).to.equal(arg_item.max);
        }
      });
    });
  });

  describe('Failure cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    async function beforeTest(test, contracts, arg_item, deployer) {
          
      await contracts.LocalLucksVRF.connect(deployer).setAutoPickWinner(arg_item.autoPick);

      let finalNumber = await contracts.LocalLucksVRF.connect(deployer).viewRandomResult(arg_item.taskId);
      if (finalNumber < 1 || (!arg_item.random && finalNumber != arg_item.max) || 
        (arg_item.random && finalNumber > arg_item.max)) {

        console.log("           prev finalNumber:" + finalNumber);
        await contracts.LocalLucksVRF.connect(deployer).reqRandomNumber(arg_item.taskId, arg_item.max);
        console.log("           new reqRandomNumber:" + test.description);
      }
    };

    tests.failure.forEach(function (failureTest) {
      it(failureTest.description, async function () {

        let { deployer, caller, contracts, acceptToken } = args;
        const {
          arg_item,
          revert,
        } = failureTest.fn();

        await beforeTest(failureTest, contracts, arg_item, deployer);

        let tx;

        if (arg_item.random) {
          tx = contracts.LocalLucksVRF.connect(deployer).callbackRandomWords(arg_item.taskId, arg_item.max);
        }
        else {
          tx = contracts.LocalLucksVRF.connect(deployer).callbackTestRandomWords(arg_item.taskId, arg_item.max);
        }

        let error = null; 
        try {
          await expect(tx).to.be.revertedWith(revert)
        }
        catch(ex) {
          error = ex;
        }
        if (error) {
          console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
          return true;
        }  
      });
    });
  });
}

const tests = {
  succes: [
    {
      description: 'localVRF - task-1 reqRandomNumber max 100',
      fn: () => ({
        arg_item: {
          taskId: 4,
          max: 106,
          random: true,
          autoPick: true
        },
      }),
    },
    {
      description: 'localVRF - task-2 reqRandomNumber max 100',
      fn: () => ({
        arg_item: {
          taskId: 2,
          max: 100,
          random: true,
          autoPick: true
        },
      }),
    },
    {
      description: 'localVRF - task-3 reqRandomNumber max 200',
      fn: () => ({
        arg_item: {
          taskId: 3,
          max: 200,
          random: true,
          autoPick: false
        },
      }),
    },
    {
      description: 'localVRF - task-3 fixed max 200',
      fn: () => ({
        arg_item: {
          taskId: 3,
          max: 200,
          random: false,
          autoPick: false
        },
      }),
    },
    
  ],
  failure: [
    {
      description: 'localVRF - task-3 fixed max 99999',
      fn: () => ({
        arg_item: {
          taskId: 3,
          max: 99999,
          random: false,
          autoPick: true
        },
        revert : "Can't find winner"
      }),
    },
  ]
};

