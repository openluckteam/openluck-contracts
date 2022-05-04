const createTask = require("./createTask.js")
const createTaskETH = require("./createTaskETH.js")
const joinTask = require("./joinTask.js")
const createGroup = require("./createGroup.js")
const joinGroup = require("./joinGroup.js")
const cancelTask = require("./cancelTask.js")
const closeTask = require("./closeTask.js")
const pickWinner = require("./pickWinner.js")
const claimTokens = require("./claimTokens.js")
const claimNFTs = require("./claimNFTs.js")
const localVRF = require("./localVRF.js")
const { getEndpointId, isNetworkAllowTaskForTest } = require("../../../utils/network")


module.exports = function () {

  // Before the tests, deploy mocked dependencies and the contract.
  before(async function () {

  });

  
  // Test each function.
  if (isNetworkAllowTaskForTest()) {
    // describe('createTask(...)', createTask);
    // describe('joinTask(...)', joinTask);
    // describe('createGroup(...)', createGroup);
    // describe('joinGroup(...)', joinGroup);
    // describe('cancelTask(...)', cancelTask); 
    describe('closeTask(...)', closeTask);
    // describe('localVRF(...)', localVRF);
    // describe('pickWinner(...)', pickWinner);
    // describe('claimTokens(...)', claimTokens); 
    describe('claimNFTs(...)', claimNFTs); 
  }
  else {
    describe('createTaskETH(...)', createTaskETH);
  }
}
