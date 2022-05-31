const { expect } = require("chai");
const { utils } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('../../helpers');

module.exports = async function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });

    // run all success test
    tests.succes.forEach(function (succesTest) {

      it(succesTest.description, async function () {

        let { deployer, joiner, joiner2, contracts, acceptToken } = args;
        const {
          arg_item,
        } = succesTest.fn({ joiner, acceptToken, joiner2, deployer });

        let tx = contracts.LucksGroup.connect(joiner).createGroup(arg_item.taskId, arg_item.seat);

        // submit
        if (!await tryCall(tx)) {
          return false;
        }

        let groupId = await contracts.LucksGroup.userGroups(arg_item.user, arg_item.taskId);
        // expect(groupId).to.greaterThan(0);

      });
    });
  });

  describe('Failure cases', function () {

    return true;
    let args;
    before(async function () {
      args = await testArgs();
    });

    tests.failure.forEach(function (failureTest) {
      it(failureTest.description, async function () {

        let { deployer, joiner, contracts, acceptToken } = args;
        const {
          arg_item,
          revert,
        } = failureTest.fn({ joiner, acceptToken });


        let tx = contracts.LucksGroup.connect(joiner).createGroup(arg_item.taskId, arg_item.seat);

        await tryRevert(tx, revert);

      });
    });
  });
}

const testTaskId = 1;
const tests = {
  succes: [
    {
      description: 'createGroup tokenId-1 accept-BNB joiner tk-1',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          seat: 10,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'createGroup tokenId-2 accept-USDC joiner tk-100',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          seat: 2,
          user: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },

    {
      description: 'createGroup tokenId-3 accept-USDT joiner tk-1',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 3,
          seat: 5,
          user: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    }
  ],
  failure: [
    {
      description: 'createGroup - taskItem not exists',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          nftChainId,
          seat: 10,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'createGroup - Invalid num = 0',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          seat: 0,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Invalid num',
      }),
    },
    {
      description: 'createGroup - Invalid num > 10001',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          seat: 10001,
          user: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Over join limit',
      }),
    },
    {
      description: 'createGroup - Insufficient funds',
      fn: ({ joiner, acceptToken } ) => ({                        
        arg_item: {
          taskId: testTaskId,
          seat: 10000,
          user: joiner.address,                 
          acceptToken: acceptToken.BNB,                 
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },            
        revert: "sender doesn't have enough funds to send tx",
      }),
    },       
    {
      description: 'createGroup - Insufficient balance',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          seat: 100000,
          user: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Insufficient balance',
      }),
    },
    {
      description: 'createGroup - Invalid status',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 4,
          seat: 1,
          user: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Invalid status',
      }),
    },
    {
      description: 'createGroup - checkExclusive not pass',
      fn: ({ joiner, acceptToken } ) => ({                        
        arg_item: {
          taskId: 2,
          seat: 3,
          user: joiner.address,                 
          acceptToken: acceptToken.USDC,                 
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),      
        },            
        revert: 'checkExclusive not pass',
      }),
    }              
  ]
};