// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Chainlink contracts
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

// Openluck interfaces
import {ILucksExecutor, TaskItem} from "../interfaces/ILucksExecutor.sol";
import {ILucksAuto,Task} from "../interfaces/ILucksAuto.sol";
import {lzTxObj} from "../interfaces/ILucksBridge.sol";
import "../libraries/SortedLinkMap.sol";

contract LucksAutoCloseTask is ILucksAuto, Ownable, Pausable, KeeperCompatibleInterface {

    using SortedLinkMap for SortedLinkMap.SortedMap;    

    SortedLinkMap.SortedMap private taskList;

    // uint256 public WAIT_PERIOD_SEC = 300; // set WAIT_PERIOD_SEC to avoid repeated execution, default 5min
    uint256 public BATCH_PERFORM_LIMIT = 10; // perform limist, default 10
    uint256 public DST_GAS_AMOUNT = 0; // layer zero dstGasAmount

    address public KEEPER; // chainLink keeper Registry Address
    ILucksExecutor public EXECUTOR;    

    /**
    * @param _keeperRegAddr The address of the keeper registry contract
    * @param _executor The LucksExecutor contract
    */
    constructor(address _keeperRegAddr, ILucksExecutor _executor) {        
        KEEPER = _keeperRegAddr;
        EXECUTOR = _executor;
    }


    modifier onlyKeeper() {
        require(msg.sender == KEEPER || msg.sender == owner(), "onlyKeeperRegistry");
        _;
    }

    modifier onlyExecutor() {
        require(msg.sender == address(EXECUTOR) || msg.sender == owner(), "onlyExecutor");
        _;
    }

    /**
    * @notice Receive funds
    */
    receive() external payable {
        emit FundsAdded(msg.value, address(this).balance, msg.sender);
    }

    //  ============ Public  functions  ============

    function size() external view returns(uint256) {
        return taskList.count;
    }

    function first() external view returns(uint256) {
        return taskList.first();
    }

    function next(uint256 taskId) external view returns(uint256) {
        return taskList.next(taskId);
    }    

    function get(uint256 taskId) external view returns(uint256) {
        return taskList.nodes[taskId].value;
    }

    function addTask(uint256 taskId, uint endTime) external override onlyExecutor {    
        if (taskId > 0 && endTime > 0) {            
            taskList.add(taskId, endTime);
        }
    }

    function removeTask(uint256 taskId) external override onlyExecutor {        
        _removeTask(taskId);
    }

    function getQueueTasks() public override view returns (uint256[] memory) {

        uint256[] memory ids = new uint256[](BATCH_PERFORM_LIMIT);

        uint256 count = 0;
        uint taskId = taskList.first();
       
        while (taskId > 0 && count < BATCH_PERFORM_LIMIT) {
                  
            if (taskList.nodes[taskId].value <= block.timestamp) {                
                ids[count] = taskId;    
                count++;                   
            }else {
                break;
            }
            taskId = taskList.next(taskId);           
        }
       
        if (count != BATCH_PERFORM_LIMIT) {
            assembly {
                mstore(ids, count)
            }
        }
        return ids;
    }

    //  ============ internal  functions  ============

    function _removeTask(uint256 taskId) internal {                
        taskList.remove(taskId);
    }

    function invokeTasks(uint256[] memory _taskIds) internal {

        lzTxObj memory _lzTxObj = lzTxObj(DST_GAS_AMOUNT, 0, bytes("0x"), bytes("0x"));

         for (uint256 i = 0; i < _taskIds.length; i++) {

            uint256 taskId = _taskIds[i];
            _removeTask(taskId);

            try EXECUTOR.closeTask(taskId, _lzTxObj) {
         
            } catch(bytes memory reason) {
                emit RevertInvoke(taskId, reason);
            }            
        }
    }

    //  ============ Keeper  functions  ============

    function checkUpkeep(bytes calldata /* checkData */) external view override whenNotPaused returns (bool upkeepNeeded, bytes memory performData) {
        uint256[] memory ids = getQueueTasks();
        upkeepNeeded = ids.length > 0;
        performData = abi.encode(ids);
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata performData) external override whenNotPaused onlyKeeper {
        uint256[] memory ids = abi.decode(performData, (uint256[]));
        invokeTasks(ids);
    }

    //  ============ onlyOwner  functions  ============
    
    /**
    * @notice Pauses the contract, which prevents executing performUpkeep
    */
    function pause() external onlyOwner {
        _pause();
    }

    /**
    * @notice Unpauses the contract
    */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
    * @notice Withdraws the contract balance
    * @param amount The amount of eth (in wei) to withdraw
    * @param payee The address to pay
    */
    function withdraw(uint256 amount, address payable payee) external onlyOwner {
        require(payee != address(0));
        emit FundsWithdrawn(amount, payee);
        payee.transfer(amount);
    }

    /**
    * @notice Sets the keeper registry address
    */
    function setKeeper(address _keeperRegAddr) public onlyOwner {
        require(_keeperRegAddr != address(0));
        emit KeeperRegistryAddressUpdated(KEEPER, _keeperRegAddr);
        KEEPER = _keeperRegAddr;
    }

    // function setWaitPeriod(uint256 second) public onlyOwner {      
    //     WAIT_PERIOD_SEC = second;
    // }

    function setBatchPerformLimist(uint256 num) public onlyOwner {      
        require(num > 0, "Invalid limit num");
        BATCH_PERFORM_LIMIT = num;
    }

    function setDstGasAmount(uint256 amount) public onlyOwner {      
        DST_GAS_AMOUNT = amount;
    }

    /**
    @notice set operator
     */
    function setExecutor(ILucksExecutor _executor) external onlyOwner {
        EXECUTOR = _executor;
    }
}

