// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

// imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Openluck interfaces
import {ILucksExecutor, TaskItem, TaskExt, TaskStatus, Ticket} from "./interfaces/ILucksExecutor.sol";
import {IProxyNFTStation} from "./interfaces/IProxyNFTStation.sol";
import {IProxyTokenStation} from "./interfaces/IProxyTokenStation.sol";
import {ILucksHelper} from "./interfaces/ILucksHelper.sol";
import {ILucksBridge, lzTxObj} from "./interfaces/ILucksBridge.sol";


/** @title Openluck LucksTrade.
 * @notice It is the core contract for crowd funds to buy NFTs result to one lucky winner
 * randomness provided externally.
 */
contract LucksExecutor is ILucksExecutor, ReentrancyGuard, Ownable 
{
    using Counters for Counters.Counter;

    Counters.Counter private ids;

    // ============ Openluck interfaces ============
    
    ILucksHelper public HELPER;    
    IProxyNFTStation public PROXY_NFT;
    IProxyTokenStation public PROXY_TOKEN;
    ILucksBridge public BRIDGE;
    
    uint16 public immutable lzChainId;
    bool public isAllowTask; // this network allow running task or not (ethereum & Rinkeby not allow)

    // ============ Public Mutable Storage ============

    // VARIABLES    
    mapping(uint256 => TaskItem) public tasks; // store tasks info by taskId    
    mapping(uint256 => mapping(uint32 => Ticket)) public tickets; // store tickets (taskId => ticketId => ticket)    
    mapping(uint256 => uint32[]) public ticketIds; // store ticket ids (taskId => lastTicketIds)    
    mapping(uint256 => uint32) public lastTIDs; // Keeps track of number of ticket per unique combination for each taskId (taskId=>last TicketId)    
    mapping(uint256 => uint256) public closeTime; // store task close time (taksId=>blocktime)    
    mapping(uint256 => uint32) public winTickets; // store the winner ticket (taskId=>ticketId)
    mapping(address => mapping(uint256 => uint32)) public userTickets; // Keep track of user ticket ids for a given taskId (user => taskId => ticket count)    
    mapping(address => mapping(uint256 => uint256)) public userClaimeds; // store user claimable token amount (user=>taskId=>amount)

    // ======== Constructor =========

    /**
     * @notice Constructor
     * @param _helper protocol helper address
     * @param _chainId layerZero chainId
     * @param _allowTask allow running task
     */
    constructor(ILucksHelper _helper, uint16 _chainId, bool _allowTask) {
        HELPER = _helper;        
        lzChainId = _chainId;
        isAllowTask = _allowTask;
    }

    //  ============ Modifiers  ============

    // MODIFIERS
    modifier onlyBridge() {
        require(msg.sender == address(BRIDGE), "onlyBridge");
        _;
    }

    modifier isExists(uint256 taskId) {
        require(exists(taskId), "Task not exists");
        _;
    }

    // ============ Public functions ============

    function count() public view override returns (uint256) {
        return ids.current();
    }

    function exists(uint256 taskId) public view override returns (bool) {
        return taskId > 0 && taskId <= ids.current();
    }

    function getTask(uint256 taskId) public view override returns (TaskItem memory) {
        return tasks[taskId];
    }

    function getChainId() external view override returns (uint16) {
        return lzChainId;
    }
    
    function createTask(TaskItem memory item, TaskExt memory ext, lzTxObj memory _param) external payable override nonReentrant {
        
        require(lzChainId == item.nftChainId, "Invalid chainId"); // action must start from NFTChain   
        require(address(PROXY_NFT) != address(0), "ProxyNFT unset");

        // inputs validation
        HELPER.checkNewTask(msg.sender, item);
        HELPER.checkNewTaskExt(ext);

        // Transfer nfts to proxy station (NFTChain) 
        // in case of dst chain transection fail, enable user redeem nft back, after endTime
        uint256 depositId = PROXY_NFT.deposit(msg.sender, item.nftContract, item.tokenIds, item.tokenAmounts, item.endTime);
        item.depositId = depositId;
             
        // Create Task Item           
        if (ext.chainId == item.nftChainId) { // same chain creation    
            _createTask(item, ext);
        }
        else {
            // cross chain creation
            require(address(BRIDGE) != address(0), "Bridge unset");
            BRIDGE.sendCreateTask{value: msg.value}(ext.chainId, payable(msg.sender), item, ext, _param);
        }
    }

    /**
    @notice buyer join a task
    num: how many ticket
    */
    function joinTask(uint256 taskId, uint32 num, string memory note) external payable override isExists(taskId) nonReentrant 
    {
        // check inputs and task
        HELPER.checkJoinTask(msg.sender, taskId, num, note);

        // Calculate number of TOKEN to this contract
        uint256 amount = tasks[taskId].price * num;

        // deposit payment to token station.        
        PROXY_TOKEN.deposit{value: msg.value}(msg.sender, tasks[taskId].acceptToken, amount);

        // create tickets
        uint32 lastTKID = _createTickets(taskId, num, msg.sender);

        // update task item info
        if (tasks[taskId].status == TaskStatus.Pending) {
            tasks[taskId].status = TaskStatus.Open; 
        }
        tasks[taskId].amountCollected += amount;    

        emit JoinTask(taskId, msg.sender, amount, num, lastTKID, note);
    }

    /**
    @notice seller cancel the task, only when task status equal to 'Pending' or no funds amount
    */
    function cancelTask(uint256 taskId, lzTxObj memory _param) external payable override isExists(taskId) nonReentrant 
    {                                
        require((tasks[taskId].status == TaskStatus.Pending || tasks[taskId].status == TaskStatus.Open) && lastTIDs[taskId] <= 0, "Opening or canceled");        
        require(tasks[taskId].seller == msg.sender, "Invalid auth"); // only seller can cancel
        
        // update status
        tasks[taskId].status = TaskStatus.Close;
        
        _withdrawNFTs(taskId, payable(tasks[taskId].seller), true, _param);

        // remove auto close Queue
        if (address(HELPER.getAutoClose()) != address(0)) {
            HELPER.getAutoClose().removeTask(taskId);
        }

        emit CancelTask(taskId, msg.sender);
    }


    /**
    @notice finish a Task, 
    case 1: reach target crowd amount, status success, and start to pick a winner
    case 2: time out and not reach the target amount, status close, and returns funds to claimable pool
    */
    function closeTask(uint256 taskId, lzTxObj memory _param) external payable override isExists(taskId) nonReentrant 
    {        
        require(tasks[taskId].status == TaskStatus.Open, "Not Open");
        require(tasks[taskId].amountCollected >= tasks[taskId].targetAmount || block.timestamp > tasks[taskId].endTime, "Not reach target or not expired");

        // mark operation time
        closeTime[taskId] = block.timestamp;

        if (tasks[taskId].amountCollected >= tasks[taskId].targetAmount) {    
            // Reached task target        
            // update task, Task Close & start to draw
            tasks[taskId].status = TaskStatus.Close; 

            // Request a random number from the generator based on a seed(max ticket number)
            HELPER.getVRF().reqRandomNumber(taskId, lastTIDs[taskId]);

            // add to auto draw Queue
            if (address(HELPER.getAutoDraw()) != address(0)) {
                HELPER.getAutoDraw().addTask(taskId, block.timestamp + HELPER.getDrawDelay());
            }

        } else {
            // Task Fail & Expired
            // update task
            tasks[taskId].status = TaskStatus.Fail; 

            // NFTs back to seller            
            _withdrawNFTs(taskId, payable(tasks[taskId].seller), false, _param);                            
        }

        // // remove auto close Queue
        // if (address(HELPER.getAutoClose()) != address(0)) {
        //     HELPER.getAutoClose().removeTask(taskId);
        // }

        emit CloseTask(taskId, msg.sender, tasks[taskId].status);
    }

    /**
    @notice start to picker a winner via chainlink VRF
    */
    function pickWinner(uint256 taskId, lzTxObj memory _param) external payable override isExists(taskId) nonReentrant
    {                
        require(tasks[taskId].status == TaskStatus.Close, "Not Close");
        require(block.timestamp >= closeTime[taskId] + HELPER.getDrawDelay(), "Delay limit");
         
        // // Calculate the finalNumber based on the randomResult generated by ChainLink's fallback
        uint32 finalNumber = HELPER.getVRF().viewRandomResult(taskId);
        require(finalNumber > 0, "Not Drawn");
        
        Ticket memory ticket = _findWinnerTicket(taskId, finalNumber);    
        require(ticket.number > 0, "Can't find winner");
        
        // update store item
        tasks[taskId].status = TaskStatus.Success;      
        winTickets[taskId] = ticket.number;
        
        // withdraw NFTs to winner (maybe cross chain)         
        _withdrawNFTs(taskId, payable(ticket.owner), true, _param);

        // dispatch Payment
        _transferPayment(taskId, ticket.owner);    
        
        emit PickWinner(taskId, ticket.owner, finalNumber);
    }


    /**
    @notice when taskItem Fail, user can claim tokens back 
    */
    function claimTokens(uint256[] memory taskIds) override external nonReentrant
    {
        for (uint256 i = 0; i < taskIds.length; i++) {
            _claimToken(taskIds[i]);
        }
    }

    /**
    @notice when taskItem Fail, user can claim NFTs back (cross-chain case)
    */
    function claimNFTs(uint256[] memory taskIds, lzTxObj memory _param) override external payable nonReentrant
    {  
        for (uint256 i = 0; i < taskIds.length; i++) {
            _claimNFTs(taskIds[i], _param);
        }
    }

    // ============ Remote(destination) functions ============
    
    function onLzReceive(uint8 functionType, bytes memory _payload) override external onlyBridge {

        if (functionType == 1) { //TYPE_CREATE_TASK
            (
                ,
                TaskItem memory item,
                TaskExt memory ext
            ) = abi.decode(_payload, (uint256, TaskItem, TaskExt));

             _createTask(item, ext);
                    
        } else if (functionType == 2) { //TYPE_WITHDRAW_NFT

            (, address user, uint256 depositId) = abi.decode(_payload, (uint8, address, uint256));            
            
            PROXY_NFT.withdraw(depositId, user); 
        }
    }    

    // ============ Internal functions ============

    /**
    @notice seller create a crowdluck task
    returns: new taskId
     */
    function _createTask(TaskItem memory item, TaskExt memory ext) internal 
    {        
        require(isAllowTask, "Chain not allow task");
        HELPER.checkNewTaskRemote(item);

        //create TaskId
        ids.increment();
        uint256 taskId = ids.current();        

        // start now
        if (item.status == TaskStatus.Open) {
            item.startTime = item.startTime < block.timestamp ? item.startTime : block.timestamp;
        } else {
            require(block.timestamp <= item.startTime && item.startTime < item.endTime, "Invalid time range");
            // start in future
            item.status = TaskStatus.Pending;
        }

        //store taskItem
        tasks[taskId] = item;

        // add to auto close Queue
        if (address(HELPER.getAutoClose()) != address(0)) {
            HELPER.getAutoClose().addTask(taskId, item.endTime);
        }

        emit CreateTask(taskId, item, ext);
    }

    /**
     * @notice join task succes. create tickets for buyer
     * @param taskId task id
     * @param num how many ticket
     * @param buyer buery
     */
    function _createTickets(uint256 taskId, uint32 num, address buyer) internal returns (uint32) 
    {
        uint32 start = lastTIDs[taskId] + 1;
        uint32 lastTKID = start + num - 1;

        tickets[taskId][lastTKID] = Ticket(lastTKID, num, buyer);
        ticketIds[taskId].push(lastTKID);

        userTickets[buyer][taskId] += num;
        lastTIDs[taskId] = lastTKID;

        emit CreateTickets(taskId, buyer, num, start, lastTKID);
        return lastTKID;
    }

    /**
     * @notice search a winner ticket by number
     * @param taskId task id
     * @param number final number
     */
    function _findWinnerTicket(uint256 taskId, uint32 number) internal view returns (Ticket memory)
    {
        // find by ticketId
        Ticket memory ticket = tickets[taskId][number];

        if (ticket.number == 0) {
            // find by ticket range (lastTKID array)
            uint32[] memory tks = ticketIds[taskId];
            for (uint256 i = 0; i < tks.length; i++) {
                uint32 lastTKID = tks[i];
                if (number < lastTKID) {
                    ticket = tickets[taskId][lastTKID];
                    break;
                }
            }
        }

        return ticket;
    }

    /**
    @notice when taskItem Fail, user can claim token back  
    */
    function _claimToken(uint256 taskId) internal isExists(taskId)
    {
        TaskItem memory item = tasks[taskId];
        require(item.status == TaskStatus.Fail, "Not Fail");
        require(userClaimeds[msg.sender][taskId] == 0, "Claimed");

        // Calculate the funds buyer payed
        uint256 amount = item.price * userTickets[msg.sender][taskId];
        
        // update claim info
        userClaimeds[msg.sender][taskId] = amount;
        
        // Transfer
        _transferOut(item.acceptToken, msg.sender, amount);

        emit ClaimToken(taskId, msg.sender, amount, item.acceptToken);
    }

    function _claimNFTs(uint256 taskId, lzTxObj memory _param) internal isExists(taskId)
    {
        address seller = tasks[taskId].seller;
        require(tasks[taskId].status == TaskStatus.Fail, "Not Fail");
        require(userClaimeds[seller][taskId] == 0, "Claimed");
        
        // update claim info
        userClaimeds[seller][taskId] = 1;
        
        // withdraw NFTs to winner (maybe cross chain)     
        _withdrawNFTs(taskId, payable(seller), true, _param);
    }

    function _withdrawNFTs(uint256 taskId, address payable user, bool enableCrossChain, lzTxObj memory _param) internal
    {
        if (lzChainId == tasks[taskId].nftChainId) { // same chain
            PROXY_NFT.withdraw(tasks[taskId].depositId, user);
        }
        else if (enableCrossChain){ // cross chain            
            BRIDGE.sendWithdrawNFTs{value: msg.value}(tasks[taskId].nftChainId, user, tasks[taskId].depositId, _param);
        }
    }

    /**
     * @notice transfer protocol fee and funds
     * @param taskId taskId
     * @param winner winner address
     * paymentStrategy for winner share is up to 50% (500 = 5%, 5,000 = 50%)
     */
    function _transferPayment(uint256 taskId, address winner) internal
    {
        // inner variables
        address acceptToken = tasks[taskId].acceptToken;

        // Calculate amount to seller
        uint256 collected = tasks[taskId].amountCollected;
        uint256 sellerAmount = collected;

        // 1. Calculate protocol fee
        uint256 fee = (collected * HELPER.getProtocolFee()) / 10000;
        address feeRecipient = HELPER.getProtocolFeeRecipient();
        require(fee >= 0, "Invalid fee");
        sellerAmount -= fee;

        // 2. Calculate winner share amount with payment stragey (up to 50%)
        uint256 winnerAmount = 0;
        uint256 winnerShare = 0;
        uint256[] memory splitShare;
        address[] memory splitAddr;
        if (tasks[taskId].paymentStrategy > 0) {
            (winnerShare, splitShare, splitAddr) = HELPER.getSTRATEGY().viewPaymentShares(tasks[taskId].paymentStrategy, winner, taskId);
            require(winnerShare >= 0 && winnerShare <= 5000, "Invalid strategy");
            require(splitShare.length <= 10, "Invalid splitShare"); // up to 10 splitter
            if (winnerShare > 0) {
                winnerAmount = (collected * winnerShare) / 10000;
                sellerAmount -= winnerAmount;
            }
        }
        
        // 3. transfer funds

        // transfer funds to seller
        _transferOut(acceptToken, tasks[taskId].seller, sellerAmount);

        // transfer protocol fee
        _transferOut(acceptToken, feeRecipient, fee);

        // transfer winner share
        if (winnerAmount > 0) {
            if (splitShare.length > 0 && splitShare.length == splitAddr.length) {  
                // split winner share for strategy case
                uint256 splited = 10000;                
                for (uint i=0; i < splitShare.length; i++) {   
                    // make sure spliter cannot overflow
                    if ((splited - splitShare[i]) >=0 && splitShare[i] > 0) { 
                        _transferOut(acceptToken, splitAddr[i], (winnerAmount * splitShare[i] / 10000));
                        splited -= splitShare[i];
                    }
                }
            }
            else {                
                _transferOut(acceptToken, winner, winnerAmount);
            }
        }                         
    }

    function _transferOut(address token, address to, uint256 amount) internal {        
        PROXY_TOKEN.withdraw(to, token, amount);
    }

    //  ============ onlyOwner  functions  ============

    function setAllowTask(bool enable) external onlyOwner {
        isAllowTask = enable;
    }

    function setLucksHelper(ILucksHelper addr) external onlyOwner {
        HELPER = addr;
    }

    function setBridgeAndProxy(ILucksBridge _bridge, IProxyTokenStation _token, IProxyNFTStation _nft) external onlyOwner {
        // require(address(BRIDGE) == address(0x0) && address(PROXY_TOKEN) == address(0x0) && address(PROXY_NFT) == address(0x0),
        //  "Lucks: BRIDGE and factory already initialized"); // 1 time only
        require(address(_bridge) != address(0x0), "Invalid bridge");
        if (isAllowTask) {
            require(address(_token) != address(0x0), "Invalid token");
        }
        require(address(_nft) != address(0x0), "Invalid nft");

        BRIDGE = _bridge;
        PROXY_TOKEN = _token;
        PROXY_NFT = _nft;
    }
}
