// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

// OpenLuck
import {TaskItem,TaskExt} from "./ILucksExecutor.sol";

struct lzTxObj {
    uint256 dstGasForCall;
    uint256 dstNativeAmount;
    bytes dstNativeAddr;
}

interface ILucksBridge {

    // ============= events ====================
    event SendMsg(uint8 msgType, uint64 nonce);
    event Revert(uint8 bridgeFunctionType, uint16 chainId, bytes srcAddress, uint256 nonce, bytes reason);
    event RetryResult(uint8 bridgeFunctionType, uint16 chainId, bytes srcAddress, uint256 nonce, bool result);
    
    // ============= Task functions ====================
    
    function sendCreateTask(
        uint16 _dstChainId,
        address payable user,
        TaskItem memory item,
        TaskExt memory ext,
        lzTxObj memory _lzTxParams) 
    external payable;

    function sendWithdrawNFTs(        
        uint16 _dstChainId,
        address payable user,
        uint256 depositId, 
        lzTxObj memory _lzTxParams) 
    external payable;

    // ============= Assets functions ====================


    function quoteLayerZeroFee(
        uint16 _dstChainId,
        uint8 _functionType,        
        string memory _note,
        lzTxObj memory _lzTxParams
    ) external view returns (uint256, uint256);
}
