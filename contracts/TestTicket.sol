// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/RedBlackTreeLibrary.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";


contract TestTicket {

    using Arrays for uint256[];

    struct Ticket {
        uint256 number;  // the ticket's id, equal to the end number (last ticket id)
        uint256 count;   // how many QTY the ticket joins, (number-count+1) equal to the start number of this ticket.
        address owner;  // ticket owner
    }

    using RedBlackTreeLibrary for RedBlackTreeLibrary.Tree;

    mapping(uint256 => RedBlackTreeLibrary.Tree) private trees;

    mapping(uint256 => mapping(uint256 => Ticket)) public tickets;

    mapping(uint256 => uint256[]) public ticketIds; 

    mapping(address => mapping(uint256 => uint256)) public userTickets;

    mapping(uint256 => uint256) public lastTIDs; 

    function addTicket(uint256 taskId, uint256 count, uint256 num, address buyer) external {
        for(uint256 i=0; i< count; i++){
            _createTickets(taskId, num, buyer);
        }
    }

    function addTicket2(uint256 taskId, uint256 count, uint256 num, address buyer) external {
        for(uint256 i=0; i< count; i++){
            _createTickets2(taskId, num, buyer);
        }
    }

    /**
     * @notice join task succes. create tickets for buyer
     * @param taskId task id
     * @param num how many ticket
     * @param buyer buery
     */
    function _createTickets(uint256 taskId, uint256 num, address buyer) internal returns (uint256) 
    {
        uint256 start = lastTIDs[taskId] + 1;
        uint256 lastTKID = start + num - 1;

        tickets[taskId][lastTKID] = Ticket(lastTKID, num, buyer);
        lastTIDs[taskId] = lastTKID;

        trees[taskId].insert(lastTKID);

        return lastTKID;
    }

    function _createTickets2(uint256 taskId, uint256 num, address buyer) internal returns (uint256) 
    {
        uint256 start = lastTIDs[taskId] + 1;
        uint256 lastTKID = start + num - 1;

        tickets[taskId][lastTKID] = Ticket(lastTKID, num, buyer);
        lastTIDs[taskId] = lastTKID;

        ticketIds[taskId].push(lastTKID);

        userTickets[buyer][taskId] += num;

        return lastTKID;
    }

    /**
     * @notice search a winner ticket by number
     * @param taskId task id
     * @param number final number
     */
    function findWinnerTicket(uint256 taskId, uint256 number) external returns (Ticket memory)
    {
        // find by ticketId
        Ticket memory ticket = tickets[taskId][number];

        if (ticket.number == 0) {
        
            uint256 node = ticketIds[taskId].findUpperBound(number);

            ticket = tickets[taskId][node];
        }
       
        return ticket;
    }

    function findWinnerTicket2(uint256 taskId, uint256 number) external returns (Ticket memory)
    {
        // find by ticketId
        Ticket memory ticket = tickets[taskId][number];

        if (ticket.number == 0) {
        
            uint node = trees[taskId].greaterThan(number);

            ticket = tickets[taskId][node];
        }
       
        return ticket;
    }

    function testFind(uint256 count) external pure returns(uint256){
        uint256 a = 0;
        for(uint256 i=0; i< count; i++){
            a = i;
        }
        return a;
    }

    function testFind2(uint256 count) external pure returns(uint256){

        for(uint256 i=0; i< count; i++){

        }
        return count;
    }
}