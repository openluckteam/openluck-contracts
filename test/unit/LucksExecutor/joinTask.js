const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { testArgs, tryRevert, tryCall } = require('./../../helpers');
const { approveToken } = require('./../../helpers/utils');

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
          arg_item
        } = succesTest.fn({ joiner, acceptToken, joiner2, deployer });

        let userTicket = await contracts.LucksExecutor.userTickets(joiner.address, arg_item.taskId);

        let tx;

        if (arg_item.acceptToken == acceptToken.BNB) {
          tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "", { value: BigNumber.from(arg_item.num).mul(arg_item.price) });
        }
        else {
          await approveToken(joiner, arg_item.acceptToken, acceptToken, contracts, contracts.ProxyTokenStation.address, BigNumber.from(arg_item.num).mul(arg_item.price));
          tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "");
        }

        // submit
        if (!(await tryCall(tx, 1))) {
          return false;
        }

        let userTicket2 = await contracts.LucksExecutor.userTickets(joiner.address, arg_item.taskId);
        expect(BigNumber.from(userTicket2)).to.equal(BigNumber.from(userTicket).add(arg_item.num));

      });
    });
  });

  describe('Failure cases', function () {

    return true;
    let args;
    before(async function () {
      args = await testArgs();
      let { deployer, caller, joiner, contracts } = args;

      // cancel task-4
      if (await contracts.LucksExecutor.connect(caller).status(4) <= 1) {
        await contracts.LucksExecutor.connect(caller).cancelTask(4);
      }
    });

    tests.failure.forEach(function (failureTest) {
      it(failureTest.description, async function () {

        let { deployer, joiner, contracts, acceptToken } = args;
        const {
          arg_item,
          revert,
        } = failureTest.fn({ joiner, acceptToken });

        if (failureTest.description == "joinTask - Insufficient balance") {
          // remove join limit 
          await contracts.LucksHelper.connect(deployer).setJoinLimitNum(0);
        }
        else if (await contracts.LucksHelper.connect(deployer).MAX_PER_JOIN_NUM() == 0) {
          await contracts.LucksHelper.connect(deployer).setJoinLimitNum(10000);
        }

        let tx;
        if (arg_item.acceptToken == acceptToken.BNB) {
          if (revert == 'Insufficient BNB balance') {
            tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "", { value: BigNumber.from(1).mul(arg_item.price) });
          }
          else {
            tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "", { value: BigNumber.from(arg_item.num).mul(arg_item.price) });
          }
        }
        else {
          await approveToken(joiner, arg_item.acceptToken, acceptToken, contracts, contracts.ProxyTokenStation.address, BigNumber.from(arg_item.num).mul(arg_item.price));
          tx = contracts.LucksExecutor.connect(joiner).joinTask(arg_item.taskId, arg_item.num, "");
        }

        // submit
        await tryRevert(tx, revert);

        if (failureTest.description == "joinTask - Insufficient balance") {
          // recover join limit 
          await contracts.LucksHelper.connect(deployer).setJoinLimitNum(10000);
        }
      });
    });
  });
}

const testTaskId = 1;
const tests = {
  succes: [
    {
      description: 'joinTask tokenId-1 accept-BNB joiner tk-1',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 1,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-1 accept-BNB joiner tk-20',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 2,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-1 accept-BNB joiner tk-60',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 3,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-1 accept-BNB joiner2 tk-10',
      fn: ({ joiner, acceptToken, joiner2 }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 1,
          buyer: joiner2.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-1 accept-BNB joiner2 tk-11',
      fn: ({ joiner, acceptToken, joiner2 }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 1,
          buyer: joiner2.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("1"),
          price: utils.parseEther("0.01"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-2 accept-USDC joiner tk-100',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          num: 30,
          buyer: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-2 accept-USDC joiner2 tk-100',
      fn: ({ joiner, acceptToken, joiner2 }) => ({
        arg_item: {
          taskId: 2,
          num: 50,
          buyer: joiner2.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-2 accept-USDC deployer tk-100',
      fn: ({ joiner, acceptToken, joiner2, deployer }) => ({
        arg_item: {
          taskId: 2,
          num: 40,
          buyer: deployer.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-3 accept-USDT joiner tk-1',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 3,
          num: 1,
          buyer: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-3 accept-USDT joiner tk-88',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 3,
          num: 8,
          buyer: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    },
    {
      description: 'joinTask tokenId-3 accept-USDT joiner2 tk-33',
      fn: ({ joiner, acceptToken, joiner2 }) => ({
        arg_item: {
          taskId: 3,
          num: 3,
          buyer: joiner2.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
      }),
    }
  ],
  failure: [
    {
      description: 'joinTask - taskItem not exists',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          nftChainId,
          num: 2,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Task not exists',
      }),
    },
    {
      description: 'joinTask - num = 0',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 0,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'num',
      }),
    },
    {
      description: 'joinTask - num > 10001',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          num: 10001,
          buyer: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Over join limit',
      }),
    },
    {
      description: 'joinTask - Insufficient funds',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: testTaskId,
          num: 10000,
          buyer: joiner.address,
          acceptToken: acceptToken.BNB,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: "sender doesn't have enough funds to send tx",
      }),
    },
    {
      description: 'joinTask - Insufficient balance',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          num: 100000,
          buyer: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'Insufficient balance',
      }),
    },
    {
      description: 'joinTask - status',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 4,
          num: 1,
          buyer: joiner.address,
          acceptToken: acceptToken.USDT,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'status',
      }),
    },
    {
      description: 'joinTask - checkExclusive not pass',
      fn: ({ joiner, acceptToken }) => ({
        arg_item: {
          taskId: 2,
          num: 3,
          buyer: joiner.address,
          acceptToken: acceptToken.USDC,
          targetAmount: utils.parseEther("10"),
          price: utils.parseEther("0.1"),
        },
        revert: 'checkExclusive not pass',
      }),
    }
  ]
};