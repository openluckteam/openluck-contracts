// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Openluck interfaces
import {ILucksGroup} from "../interfaces/ILucksGroup.sol";
import {ILucksExecutor, TaskItem, TaskStatus, UserState} from "../interfaces/ILucksExecutor.sol";


/** @title Openluck LucksGroup
 * @notice It is the contract for LucksGroup
 */
contract LucksGroup is ILucksGroup, ReentrancyGuardUpgradeable, OwnableUpgradeable {

    using Counters for Counters.Counter;    

    ILucksExecutor public EXECUTOR;

    uint32 public MAX_SEAT;
    
    mapping(uint256 => uint256) public groupIds;               // groupId counter (taskId => groupId)
    mapping(uint256 => mapping(uint256 => address[])) public groups;     // store task groups (taskId => groupId => group member address)
    mapping(address => mapping(uint256 => uint256)) public userGroups;   // store user joined groups (user => taskId => groupId)
    mapping(uint256 => mapping(uint256 => uint16)) public groupSeat;     // store group setting(task=> groupId = > group seat)

    function initialize(address _executor, uint32 _maxSeat) external initializer { 
        __ReentrancyGuard_init();
        __Ownable_init();
        EXECUTOR = ILucksExecutor(_executor);        
        MAX_SEAT = _maxSeat;
    }

    function getGroupUsers(uint256 taskId, address user) override view public returns (address[] memory){                
        return groups[taskId][userGroups[user][taskId]];
    }

    function joinGroup(uint256 taskId, uint256 groupId, uint16 seat) override public {   
        address user = msg.sender;                  
        require(groupId > 0 && groupId <= groupIds[taskId], "Invalid groupId");
        
        // join
        if (groups[taskId][groupId].length < MAX_SEAT) {      

            _validation(user, taskId, seat);

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
                 
        _validation(user, taskId, seat);
        
        uint256 groupId = groupIds[taskId] + 1;
        groupIds[taskId] = groupId;

        groups[taskId][groupId].push(user);
        userGroups[user][taskId] = groupId;

        emit CreateGroup(user, taskId, groupId, seat);
    }

    function _validation(address user, uint256 taskId, uint16 seat) internal view {
        require(seat <= MAX_SEAT && seat > 1, "Invalid seat");
        require(userGroups[user][taskId] == 0, "Already join a group");
        require(address(EXECUTOR)!=address(0), "EXECUTOR not set");
            
        TaskItem memory item = EXECUTOR.getTask(taskId);        
        require(block.timestamp <= item.endTime, "endTime");    
        require(item.status == TaskStatus.Pending || item.status == TaskStatus.Open, "status");

        UserState memory state = EXECUTOR.getUserState(taskId, user);
        require(state.num > 0, "No tickets");
    }
    
    /**
    @notice set operator
     */
    function setExecutor(ILucksExecutor _executor) external onlyOwner {
        EXECUTOR = _executor;
    }
}