// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Chainlink contracts
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

// Openluck interfaces
import {ILucksBridge, lzTxObj} from "../interfaces/ILucksBridge.sol";
import "./LucksAutoTask.sol";

contract LucksAutoDrawTask is LucksAutoTask, KeeperCompatibleInterface {

    uint16 public immutable lzChainId;

    ILucksBridge public BRIDGE;

    /**
    * @param _keeperRegAddr The address of the keeper registry contract
    * @param _executor The LucksExecutor contract
    * @param _bridge The LucksBridge contract
    */
    constructor(address _keeperRegAddr, ILucksExecutor _executor, ILucksBridge _bridge, uint16 _lzChainId) LucksAutoTask(_keeperRegAddr, _executor){        
        DST_GAS_AMOUNT = 550000;
        BRIDGE = _bridge;
        lzChainId = _lzChainId;
    }    

    //  ============ internal  functions  ============

    function invokeTasks(uint256[] memory _taskIds) internal override {

        lzTxObj memory _lzTxObj = lzTxObj(DST_GAS_AMOUNT, 0, bytes("0x"), bytes("0x"));
              
        for (uint256 i = 0; i < _taskIds.length; i++) {

            uint256 taskId = _taskIds[i];
            _removeTask(taskId);

            uint256 quoteLayerZeroFee = 0;
            TaskItem memory item = EXECUTOR.getTask(taskId);
            if (item.nftChainId != lzChainId) {
                if (address(BRIDGE) != address(0)) {
                    (quoteLayerZeroFee,) = BRIDGE.quoteLayerZeroFee(item.nftChainId, 2, "", _lzTxObj);
                }
            }

            if (address(this).balance < quoteLayerZeroFee) {
                emit RevertInvoke(taskId, "AutoDraw: not enough fees");
            }            
            else {             

                try EXECUTOR.pickWinner{value: quoteLayerZeroFee}(taskId, _lzTxObj){

                } catch(bytes memory reason) {
                    emit RevertInvoke(taskId, _getRevertMsg(reason));
                }
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
    @notice set BRIDGE
     */
    function setBridge(ILucksBridge _bridge) external onlyOwner {
        BRIDGE = _bridge;
    }
}

