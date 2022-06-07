const { expect } = require('chai');
const { BigNumber, utils, ethers } = require("ethers");
const { testArgs} = require('./../../helpers');
const CONFIG = require('../../../constants/config.json');

module.exports = function () {

  describe('Success cases', function () {

    let args;
    before(async function () {
      args = await testArgs();
    });


    let feeds = CONFIG.PriceFeeds[hre.network.name];
    // if (feeds && feeds.length > 0) {

    //   for (let i = 0; i < feeds.length; i++) {
    //     let feed = feeds[i];
    //     let currency = feed.name.split("/")[1].trim();
    //     let token = feed.name.split("/")[0].trim();
    //     it(`tokenPrice ${feed.name}`, async function () {

    //       let { contracts } = args;
    //       let price = ethers.utils.formatEther(await contracts.TokenPrices.getPrice(currency, token));
    //       console.log(`       tokenPrice ${feed.name}, price:${price}`);
    //       expect(1).to.greaterThan(0);
    //     });
    //   }
    // }

    it(`tokenPrice prices`, async function () {
      let { contracts } = args;
      let prices = await contracts.TokenPrices.getPrices("USD", ["BNB", "ETH", "USDC", "USDT", "BUSD"]);
      prices.forEach(element => {
        console.log(`         tokenPrices:${ethers.utils.formatEther(element)}`);
      });
      
    });
  });

}