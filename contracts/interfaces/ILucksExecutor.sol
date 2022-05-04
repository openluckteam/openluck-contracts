// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { lzTxObj } from "./ILucksBridge.sol";

/** 
    TaskStatus
    0) Pending: task created but not reach starttime
    1) Open: task opening
    2) Close: task close, waiting for draw
    3) Success: task reach target, drawed winner
    4) Fail: task Fail and expired
    5) Cancel: task user cancel
 */
enum TaskStatus {
    Pending,
    Open,
    Close,
    Success,
    Fail,
    Cancel
}

struct ExclusiveToken {
    address token; // exclusive token contract address    
    uint256 amount; // exclusive token holding amount required
}

struct TaskItem {

    address seller; // Owner of the NFTs
    uint16 nftChainId; // NFT source ChainId    
    address nftContract; // NFT registry address    
    uint256[] tokenIds; // Allow mulit nfts for sell    
    uint256[] tokenAmounts; // support ERC1155
    
    address acceptToken; // acceptToken    
    TaskStatus status; // Task status    

    uint256 startTime; // Task start time    
    uint256 endTime; // Task end time
    
    uint256 targetAmount; // Task target crowd amount (in wei) for the published item    
    uint256 price; // Per ticket price  (in wei)    
    
    uint16 paymentStrategy; // payment strategy;
    ExclusiveToken exclusiveToken; // exclusive token contract address    
    
    // editable fields
    uint256 amountCollected; // The amount (in wei) collected of this task
    uint256 depositId; // NFTs depositId (system set)
}

struct TaskExt {
    uint16 chainId; // Task Running ChainId   
    string title; // title (for searching keywords)  
    string note;   // memo
}

struct Ticket {
    uint32 number;  // the ticket's id, equal to the end number (last ticket id)
    uint32 count;   // how many QTY the ticket joins, (number-count+1) equal to the start number of this ticket.
    address owner;  // ticket owner
}

interface ILucksExecutor {

    // ============= events ====================

    event CreateTask(uint256 taskId, TaskItem item, TaskExt ext);
    event CancelTask(uint256 taskId, address seller);
    event CloseTask(uint256 taskId, address caller, TaskStatus status);
    event JoinTask(uint256 taskId, address buyer, uint256 amount, uint256 count, uint32 number,string note);
    event PickWinner(uint256 taskId, address winner, uint32 number);
    event ClaimToken(uint256 taskId, address caller, uint256 amount, address acceptToken);
    event CreateTickets(uint256 taskId, address buyer, uint32 num, uint32 start, uint32 end);

    // ============= functions ====================

    function count() external view returns (uint256);
    function exists(uint256 taskId) external view returns (bool);
    function getTask(uint256 taskId) external view returns (TaskItem memory);
    function getChainId() external view returns (uint16);

    function createTask(TaskItem memory item, TaskExt memory ext, lzTxObj memory _param) external payable;
    function joinTask(uint256 taskId, uint32 num, string memory note) external payable;
    function cancelTask(uint256 taskId, lzTxObj memory _param) external payable;
    function closeTask(uint256 taskId, lzTxObj memory _param) external payable;
    function pickWinner(uint256 taskId, lzTxObj memory _param) external payable;

    function claimTokens(uint256[] memory taskIds) external;
    function claimNFTs(uint256[] memory taskIds, lzTxObj memory _param) external payable;

    function onLzReceive(uint8 functionType, bytes memory _payload) external;
}
