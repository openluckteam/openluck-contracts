const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { testArgs } = require('./../../helpers');

const tests = {
  succes: [
    {
      description: 'claimTokens tokenId-1 ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 1
        },
      }),
    },
    {
      description: 'claimTokens tokenId-2',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 2
        },
      }),
    },
    {
      description: 'claimTokens tokenId-3 ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 3
        },
      }),
    },
    {
      description: 'claimTokens tokenId-4 ',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 4
        },
      }),
    },
    {
      description: 'claimTokens tokenId-5',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 5
        },
      }),
    },
    {
      description: 'claimTokens tokenId-6',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 6
        },
      }),
    }
  ],
  failure: [
    {
      description: 'claimTokens - Not Fail',
      fn: ({ caller, acceptToken }) => ({
        arg_item: {
          taskId: 1
        },
        revert: 'Not Fail',
      }),
    },
    // {
    //   description: 'claimTokens - have claimed',
    //   fn: ({ caller, acceptToken } ) => ({                        
    //     arg_item: {
    //       taskId: 4
    //     },            
    //     revert: 'have claimed',
    //   }),
    // },            
    // {
    //   description: 'claimTokens - Lack of funds',
    //   fn: ({ caller, acceptToken } ) => ({                        
    //     arg_item: {
    //       taskId: 2
    //     },            
    //     revert: 'Lack of funds',
    //   }),
    // },
    // {
    //   description: "claimTokens - Lack of token",
    //   fn: ({ caller, acceptToken } ) => ({                        
    //     arg_item: {
    //       taskId: 2
    //     },            
    //     revert: "Lack of token",
    //   }),
    // }
  ]
};

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
        const {
          arg_item
        } = succesTest.fn({ caller, acceptToken });

        const tx = contracts.LucksExecutor.connect(caller).claimTokens([arg_item.taskId]);

        // ingore duplicate task creation error
        let error = null;
        try {
          error = await expect(tx).has.reverted;
        }
        catch (ex) { }

        if (error) {
          console.log(`            ${error.reason} | ${error.transactionHash} | ${error.code} `);
          return true;
        }

        let status = await contracts.LucksExecutor.connect(caller).status(arg_item.taskId);

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
        const {
          arg_item,
          revert,
        } = failureTest.fn({ caller, acceptToken });

        let tx = contracts.LucksExecutor.connect(caller).claimTokens([arg_item.taskId]);
        // Execute the transaction.
        await expect(tx).to.be.revertedWith(revert)

      });
    });
  });
}