  // SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

struct Task {
    uint256 endTime;
    uint256 lastTimestamp;
}

interface ILucksAuto {

    event FundsAdded(uint256 amountAdded, uint256 newBalance, address sender);
    event FundsWithdrawn(uint256 amountWithdrawn, address payee);

    event KeeperRegistryAddressUpdated(address oldAddress, address newAddress);
    event MinWaitPeriodUpdated(uint256 oldMinWaitPeriod, uint256 newMinWaitPeriod);

    event RevertInvoke(uint256 taskId, bytes reason);

    function addTask(uint256 taskId, uint endTime) external;
    function removeTask(uint256 taskId) external;
    function getQueueTasks() external view returns (uint256[] memory);

}