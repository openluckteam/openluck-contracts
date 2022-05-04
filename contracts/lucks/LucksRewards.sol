// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Openluck interfaces
import {ILucksRewards} from "../interfaces/ILucksRewards.sol";
import {Ticket} from "../interfaces/ILucksExecutor.sol";
import {ILucksExecutor, TaskItem, TaskStatus} from "../interfaces/ILucksExecutor.sol";


/** @title Openluck LucksRewards
 * @notice It is the contract for LucksRewards
 */
contract LucksRewards is ILucksRewards {

    using Counters for Counters.Counter;    

    ILucksExecutor public EXECUTOR;

    address public OpenLuckToken;

    mapping(address => address) private inviters;     // store invite relationship (invitee => inviter)
    mapping(address => uint256) private inviteNums;    // store invter fans count (inviter => invitee count)
    
    constructor(address _executor, address _token) {
        EXECUTOR =  ILucksExecutor(_executor);        
        OpenLuckToken = _token;
    }

    function getInviter(address invitee) override view public returns (address) {
        return inviters[invitee];
    }

    function invite(address invitee, address inviter) override public {
        require(inviters[invitee] == address(0), "Already invite");
        inviters[invitee] = inviter;
        inviteNums[inviter] += 1;
    }

    function rewardCreateTask(address seller, uint256 taskId) override public {
        emit RewardCreateTask(seller, taskId);
    }

    function rewardJoinTask(address user, uint256 taskId, address acceptToken, uint256 amount) override public {
        emit RewardJoinTask(user, taskId, acceptToken, amount);
    }

    function rewardTaskSucess(uint256 taskId) override public {
        emit RewardTaskSucess(taskId);
    }

    function rewardTaskFail(uint256 taskId) override public {
        emit RewardTaskFail(taskId);
    } 
}