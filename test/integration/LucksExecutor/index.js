const createTask = require("./createTask.js")
const createTaskETH = require("./createTaskETH.js")
const openTask = require("./openTask.js")

const { isNetworkAllowTaskForTest } = require("../../../utils/network")


module.exports = function () {

  // Before the tests, deploy mocked dependencies and the contract.
  before(async function () {

  });


  // Test each function.
  if (isNetworkAllowTaskForTest()) {
    describe('createTask(...)', createTask);
    describe('openTask(...)', openTask);
    
  }
  else {
    describe('createTaskETH(...)', createTaskETH);
  }
}
