const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { ethers } = require('hardhat');

const { testArgs, tryRevert, tryCall } = require('../../helpers');
const { approveToken } = require('../../helpers/utils');

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
        } = succesTest.fn({ joiner, acceptToken, joiner2,deployer });
        
        let tx = contracts.LucksGroup.connect(joiner).joinGroup(arg_item.taskId, arg_item.groupId, arg_item.seat);
        
        // submit
        await tryCall(tx, 1);       
               
        // let groupId = await contracts.LucksGroup.userGroups(arg_item.user, arg_item.taskId);
        
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
        
        let tx = contracts.LucksGroup.connect(joiner).joinGroup(arg_item.taskId, arg_item.groupId, arg_item.seat);

        // submit
        await tryRevert(tx, revert);      

      });
    });
  });
}

const testTaskId = 1;
const tests = {
  succes: [
    {
      description: 'joinGroup tokenId-1 accept-BNB joiner tk-1',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    // {
    //   description: 'joinGroup tokenId-1 accept-BNB joiner tk-20',
    //   fn: ({ joiner, acceptToken }) => ({
    //     arg_item: {
    //       taskId: testTaskId,
    //       groupId: 2,
    //       user: joiner.address,
    //       acceptToken: acceptToken.BNB,
    //       targetAmount: utils.parseEther("1"),
    //       price: utils.parseEther("0.01"),
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-1 accept-BNB joiner tk-60',
    //   fn: ({ joiner, acceptToken }) => ({
    //     arg_item: {
    //       taskId: testTaskId,
    //       groupId: 3,
    //       user: joiner.address,
    //       acceptToken: acceptToken.BNB,
    //       targetAmount: utils.parseEther("1"),
    //       price: utils.parseEther("0.01"),
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-1 accept-BNB joiner2 tk-10',
    //   fn: ({ joiner, acceptToken, joiner2 }) => ({
    //     arg_item: {
    //       taskId: testTaskId,
    //       groupId: 1,
    //       user: joiner2.address,
    //       acceptToken: acceptToken.BNB,
    //       targetAmount: utils.parseEther("1"),
    //       price: utils.parseEther("0.01"),
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-1 accept-BNB joiner2 tk-11',
    //   fn: ({ joiner, acceptToken, joiner2 }) => ({
    //     arg_item: {
    //       taskId: testTaskId,
    //       groupId: 1,
    //       user: joiner2.address,
    //       acceptToken: acceptToken.BNB,
    //       targetAmount: utils.parseEther("1"),
    //       price: utils.parseEther("0.01"),
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-2 accept-USDC joiner tk-100',
    //   fn: ({ joiner, acceptToken }) => ({
    //     arg_item: {
    //       taskId: 2,
    //       groupId: 1,
    //       user: joiner.address,
    //       acceptToken: acceptToken.USDC,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-2 accept-USDC joiner2 tk-100',
    //   fn: ({ joiner, acceptToken, joiner2 }) => ({
    //     arg_item: {
    //       taskId: 2,
    //       groupId: 1,
    //       user: joiner2.address,
    //       acceptToken: acceptToken.USDC,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-2 accept-USDC deployer tk-100',
    //   fn: ({ joiner, acceptToken, joiner2, deployer }) => ({
    //     arg_item: {
    //       taskId: 2,
    //       groupId: 1,
    //       user: deployer.address,
    //       acceptToken: acceptToken.USDC,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-3 accept-USDT joiner tk-1',
    //   fn: ({ joiner, acceptToken }) => ({
    //     arg_item: {
    //       taskId: 3,
    //       groupId: 1,
    //       user: joiner.address,
    //       acceptToken: acceptToken.USDT,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-3 accept-USDT joiner tk-88',
    //   fn: ({ joiner, acceptToken }) => ({
    //     arg_item: {
    //       taskId: 3,
    //       groupId: 8,
    //       user: joiner.address,
    //       acceptToken: acceptToken.USDT,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // },
    // {
    //   description: 'joinGroup tokenId-3 accept-USDT joiner2 tk-33',
    //   fn: ({ joiner, acceptToken, joiner2 }) => ({
    //     arg_item: {
    //       taskId: 3,
    //       groupId: 3,
    //       user: joiner2.address,
    //       acceptToken: acceptToken.USDT,
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },
    //   }),
    // }
  ],
  failure: [
    {
      description: 'joinGroup - taskItem not exists',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          nftChainId,
          groupId: 2,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          seat: 10,
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'joinGroup - Invalid num = 0',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          groupId: 0,
          user: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          seat: 10,
        },
        revert: 'Invalid num',
      }),
    },
    {
      description: 'joinGroup - Invalid num > 10001',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          groupId: 10001,
          user: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          seat: 10,
        },
        revert: 'Over join limit',
      }),
    },
    // {
    //   description: 'joinGroup - Insufficient funds',
    //   fn: ({ joiner, acceptToken } ) => ({                        
    //     arg_item: {
    //       taskId: testTaskId,
    //       groupId: 10000,
    //       user: joiner.address,                 
    //       acceptToken: acceptToken.BNB,                 
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,
    //     },            
    //     revert: "sender doesn't have enough funds to send tx",
    //   }),
    // },       
    {
      description: 'joinGroup - Insufficient balance',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          groupId: 100000,
          user: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          seat: 10,
        },
        revert: 'Insufficient balance',
      }),
    },
    {
      description: 'joinGroup - Invalid status',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 4,
          groupId: 1,
          user: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          seat: 10,
        },
        revert: 'Invalid status',
      }),
    },
    // {
    //   description: 'joinGroup - checkExclusive not pass',
    //   fn: ({ joiner, acceptToken } ) => ({                        
    //     arg_item: {
    //       taskId: 2,
    //       groupId: 3,
    //       user: joiner.address,                 
    //       acceptToken: acceptToken.USDC,                 
    //       targetAmount: utils.parseEther("10"),
    //       seat: 10,      
    //     },            
    //     revert: 'checkExclusive not pass',
    //   }),
    // }              
  ]
};