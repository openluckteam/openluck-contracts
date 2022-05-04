// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IProxyTokenStation {

    event Deposit(address indexed user, address token, uint256 amount);
    event Withdraw(address indexed user, address token, uint256 amount);

    function deposit(address user, address token, uint256 amount) external payable;
    function withdraw(address user, address token, uint256 amount) external;
}