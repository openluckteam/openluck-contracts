// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Openluck interfaces
import {ILucksGroup} from "../interfaces/ILucksGroup.sol";
import {ILucksExecutor, TaskItem, TaskStatus} from "../interfaces/ILucksExecutor.sol";


/** @title Openluck LucksGroup
 * @notice It is the contract for LucksGroup
 */
contract LucksGroup is ILucksGroup, Ownable {

    using Counters for Counters.Counter;    

    ILucksExecutor public EXECUTOR;

    uint32 public MAX_SEAT = 10;
    
    mapping(uint256 => uint256) public groupIds;               // groupId counter (taskId => groupId)
    mapping(uint256 => mapping(uint256 => address[])) public groups;     // store task groups (taskId => groupId => group member address)
    mapping(address => mapping(uint256 => uint256)) public userGroups;   // store user joined groups (user => taskId => groupId)
    mapping(uint256 => mapping(uint256 => uint16)) public groupSeat;     // store group setting(task=> groupId = > group seat)

    constructor(address _executor, uint32 _maxSeat) {
        EXECUTOR =  ILucksExecutor(_executor);        
        MAX_SEAT = _maxSeat;
    }

    function getGroupUsers(uint256 taskId, address user) override view public returns (address[] memory){                
        return groups[taskId][userGroups[user][taskId]];
    }

    function joinGroup(uint256 taskId, uint256 groupId, uint16 seat) override public {   
        address user = msg.sender;                  
        require(groupId > 0 && groupId <= groupIds[taskId], "Invalid groupId");
        require(seat <= MAX_SEAT, "Invalid seat");
        require(userGroups[user][taskId] == 0, "Already join a group");
        require(address(EXECUTOR)!=address(0), "EXECUTOR not set");
            
        TaskItem memory item = EXECUTOR.getTask(taskId);        
        require(block.timestamp <= item.endTime, "Invalid time range");    
        require(item.status == TaskStatus.Pending || item.status == TaskStatus.Open, "Invalid status");

        // join
        if (groups[taskId][groupId].length < MAX_SEAT) {            
            groups[taskId][groupId].push(user);
            userGroups[user][taskId] = groupId;

            emit JoinGroup(user, taskId, groupId);
        }
        else {
            if (seat > 1) {
                // over seat, create new group
                _createGroup(user, taskId, seat); 
            }
            else {
                revert("Exceed seat");
            }
        }
    }

    function createGroup(uint256 taskId, uint16 seat) override public {  
        _createGroup(msg.sender, taskId, seat);
    }

    function _createGroup(address user, uint256 taskId, uint16 seat) internal {            
                 
        require(seat <= MAX_SEAT && seat > 1, "Invalid seat");
        require(userGroups[user][taskId] == 0, "Already join a group");
        require(address(EXECUTOR)!=address(0), "EXECUTOR not set");
            
        TaskItem memory item = EXECUTOR.getTask(taskId);        
        require(block.timestamp <= item.endTime, "Invalid time range");    
        require(item.status == TaskStatus.Pending || item.status == TaskStatus.Open, "Invalid status");
        
        uint256 groupId = groupIds[taskId] + 1;
        groupIds[taskId] = groupId;

        groups[taskId][groupId].push(user);
        userGroups[user][taskId] = groupId;

        emit CreateGroup(user, taskId, groupId, seat);
    }

    
    /**
    @notice set operator
     */
    function setExecutor(ILucksExecutor _executor) external onlyOwner {
        EXECUTOR = _executor;
    }
}