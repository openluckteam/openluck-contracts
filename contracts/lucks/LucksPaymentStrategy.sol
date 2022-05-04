// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Openluck interfaces
import {ILucksPaymentStrategy} from "../interfaces/ILucksPaymentStrategy.sol";
import {ILucksGroup} from "../interfaces/ILucksGroup.sol";
import {ILucksExecutor, Ticket} from "../interfaces/ILucksExecutor.sol";


/** @title Openluck LucksPaymentStrategy
 * @notice It is the contract for PaymentStrategy
 */
contract LucksPaymentStrategy is ILucksPaymentStrategy {    

    ILucksExecutor public EXECUTOR;
    ILucksGroup public GROUPS;

    constructor(address _executor, ILucksGroup _groups) {
        EXECUTOR = ILucksExecutor(_executor);
        GROUPS = _groups;
    }

    function getShareRate(uint16 strategyId) public override pure returns (uint32) {
        if (strategyId == 1){ // 10%
            return 1000;  
        } else if (strategyId == 2) { // 20%
            return 2000;   
        }
        else if (strategyId == 3){ // 30%
            return 3000;
        }
        else {
            return 0;
        }
    }

    function viewPaymentShares(uint16 strategyId, address winner,uint256 taskId) 
      override public view returns (uint256, uint256[] memory, address[] memory) 
    {        
        uint32 rate = getShareRate(strategyId);
        uint256[] memory spliter;
        address[] memory users;

        if (rate > 0) {                               
            users = GROUPS.getGroupUsers(taskId, winner);
            if (users.length > 1){            
                spliter = new uint256[](users.length);
                uint256 splitShare = 10000 / users.length;
                for (uint i=0; i< users.length; i++) {
                    spliter[i] = splitShare;
                }            
            }             
        }

        return (rate,spliter,users);
    }
}