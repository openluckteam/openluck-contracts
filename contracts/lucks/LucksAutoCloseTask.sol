// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Chainlink contracts
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

// Openluck interfaces
import "./LucksAutoTask.sol";

contract LucksAutoCloseTask is LucksAutoTask, KeeperCompatibleInterface {

    /**
    * @param _keeperRegAddr The address of the keeper registry contract
    * @param _executor The LucksExecutor contract
    */
    constructor(address _keeperRegAddr, ILucksExecutor _executor) LucksAutoTask(_keeperRegAddr,_executor){        
    }


    //  ============ internal  functions  ============

    function invokeTasks(uint256[] memory _taskIds) internal override {

        lzTxObj memory _lzTxObj = lzTxObj(DST_GAS_AMOUNT, 0, bytes("0x"), bytes("0x"));

         for (uint256 i = 0; i < _taskIds.length; i++) {

            uint256 taskId = _taskIds[i];
            _removeTask(taskId);

            try EXECUTOR.closeTask(taskId, _lzTxObj) {
         
            } catch(bytes memory reason) {
                emit RevertInvoke(taskId, _getRevertMsg(reason));
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
}

