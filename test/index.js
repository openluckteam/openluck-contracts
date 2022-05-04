const { ethers, config } = require('hardhat');
const unit =  require('./unit');
// const integration =  require('./integration');

module.exports = function (){

  // Run the tests.
  describe('Unit', unit);
  // describe.only('Integration', integration);

}()