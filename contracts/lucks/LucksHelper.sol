// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Openluck interfaces
import {ILucksExecutor, TaskItem, TaskExt, TaskStatus} from "../interfaces/ILucksExecutor.sol";
import {ILucksHelper} from "../interfaces/ILucksHelper.sol";
import {ILucksVRF} from "../interfaces/ILucksVRF.sol";
import {ILucksGroup} from "../interfaces/ILucksGroup.sol";
import {ILucksPaymentStrategy} from "../interfaces/ILucksPaymentStrategy.sol";
import {ILucksAuto} from "../interfaces/ILucksAuto.sol";

/** @title Openluck LucksHelper.
 * @notice It is the contract for protocol settings
 */
contract LucksHelper is ILucksHelper, Ownable {
    using SafeMath for uint256;
    // ============ Openluck interfaces ============

    ILucksExecutor public EXECUTOR;
    ILucksVRF public VRF;
    ILucksGroup public GROUPS;
    ILucksPaymentStrategy public STRATEGY;  

    ILucksAuto public AUTO_CLOSE;  
    ILucksAuto public AUTO_DRAW;  

    address public feeRecipient;    // protocol fee recipient

    uint32 public MAX_PER_JOIN_NUM = 10000;    // limit user per jointask num (default 10000), to avoid block fail and huge gas fee
    uint32 public DRAW_DELAY_SEC = 120;    // picker winner need a delay time from task close. (default 2min)
    uint256 public protocolFee = 200;     // acceptToken (200 = 2%, 1,000 = 10%)

    mapping(address => bool) public operators;     // protocol income balance (address => bool)
    mapping(address => bool) public acceptTokens;   // accept payment tokens (Chain Token equals to zero address)     
    mapping(address => uint256) public minTargetAmount;  // when seller create task, check the min targetAmount limit (token address => min amount)

    constructor(
        address[] memory _acceptTokens,
        address _recipient,
        uint256 _fee,
        ILucksExecutor  _executor,
        ILucksVRF _vrf,
        ILucksGroup _groups,
        ILucksPaymentStrategy _strategy,
        ILucksAuto _auto_close,
        ILucksAuto _auto_draw
    ) {
        feeRecipient = _recipient;
        protocolFee = _fee;
        EXECUTOR = _executor;
        VRF = _vrf;        
        GROUPS = _groups;
        STRATEGY = _strategy;
        AUTO_CLOSE = _auto_close;
        AUTO_DRAW = _auto_draw;
        setAcceptTokens(_acceptTokens, true);
    }

    modifier onlyOperator() {
        require(msg.sender == owner() || operators[msg.sender], "onlyOperator");
        _;
    }

    function getMinTargetLimit(address token) external view override returns (uint256) {
        return minTargetAmount[token];
    }

    function checkPerJoinLimit(uint32 num) public view override returns (bool) {
        return MAX_PER_JOIN_NUM < 1 || num <= MAX_PER_JOIN_NUM;
    }

    /**
    @notice check acceptToken support
    @param acceptToken token address, blockchain token is address(0)
    @return bool
    */
    function checkAcceptToken(address acceptToken)
        public
        view
        override
        returns (bool)
    {
        return acceptTokens[acceptToken];
    }

    /**
     * @notice check nft contract, support erc721 & erc1155
     */
    function checkNFTContract(address addr) public view override returns (bool) {
        require(addr != address(0) && Address.isContract(addr), "Invalid nftContract");
        require(
            IERC165(addr).supportsInterface(0x80ac58cd) ||  // ERC721 interfaceID
            IERC165(addr).supportsInterface(0xd9b67a26), // ERC1155 interfaceID
            "Invalid contract"
        );
        return true;
    }

    /**
     * @notice check the new task inputs
     */
    function checkNewTask(address user, TaskItem memory item) public view override returns(bool) { 

        require(item.seller != address(0) && item.seller == user, "Invalid seller address");      
        require(item.nftChainId > 0, "Invalid nftChainId");       
        require(item.tokenIds.length > 0, "Empty tokenIds");
        require(block.timestamp < item.endTime, "Invalid time range");
        require(item.endTime - block.timestamp > 84600 , "Duration too short"); // at least 23.5 hour
        require(item.price > 0 && item.price < item.targetAmount && item.targetAmount % item.price == 0,"Invalid price or targetAmount");

        require(item.amountCollected == 0, "Invalid amountCollected");    
       
        // check nftContract
        require(checkNFTContract(item.nftContract), "Invalid nftContract");
        (bool checkState, string memory checkMsg) = checkTokenListing(item.nftContract, item.seller, item.tokenIds, item.tokenAmounts);
        require(checkState, checkMsg);

        return true;
    }

    function checkNewTaskExt(TaskExt memory ext) public pure override returns(bool) {
        require(bytes(ext.title).length >=0 && bytes(ext.title).length <= 256, "Invalid ext title");
        require(bytes(ext.note).length <= 256, "Invalid ext note");
        return true;
    }

    function checkNewTaskRemote(TaskItem memory item) public view override returns (bool) 
    {        
        if (address(item.exclusiveToken.token) != address(0) && item.exclusiveToken.amount > 0) {
            require(Address.isContract(item.exclusiveToken.token), "Invalid exclusiveToken");
        }       
        require(checkAcceptToken(item.acceptToken), "Unsupported acceptToken");
        uint256 minTarget = minTargetAmount[item.acceptToken];
        require(minTarget == 0 || item.targetAmount >= minTarget, "Target too small");
        return true;
    }

    function checkJoinTask(address user, uint256 taskId, uint32 num, string memory note) public view override returns(bool) {

        require(bytes(note).length <= 256, "Note too large");
        require(checkPerJoinLimit(num), "Over join limit");                
        require(num > 0, "Invalid num");

        TaskItem memory item = EXECUTOR.getTask(taskId);

        require(item.seller != user, "Not allow owner");
        require(block.timestamp >= item.startTime && block.timestamp <= item.endTime, "Invalid time range");
        require(item.status == TaskStatus.Pending || item.status == TaskStatus.Open, "Invalid status");

        // Calculate number of TOKEN to this contract
        uint256 amount = item.price.mul(num);
        require(amount > 0, "Invalid amount");

        // check Exclusive
        if (address(item.exclusiveToken.token) != address(0) && item.exclusiveToken.amount > 0) {
            require(
                checkExclusive(user, address(item.exclusiveToken.token), item.exclusiveToken.amount),
                "Not pass EXCLUSIVE"
            );
        }

        return true;
    }

    /**
     * @notice checking seller listing NFTs ownership and balance
     * @param addr NFT contract address
     * @param tokenIds tokenId array
     * @param amounts tokenId amount array (ERC721 can be null)
     */
    function checkTokenListing(address addr, address seller, uint256[] memory tokenIds, uint256[] memory amounts) public view override returns (bool, string memory)
    {
        if (IERC165(addr).supportsInterface(0x80ac58cd)) {         // ERC721 interfaceID
            for (uint256 i = 0; i < tokenIds.length; i++) {
                if (IERC721(addr).ownerOf(tokenIds[i]) != seller) {
                    return (false, "Token listed or not owner");
                }               
            }
        } else if (IERC165(addr).supportsInterface(0xd9b67a26)) {  // ERC1155 interfaceID
            require(tokenIds.length == amounts.length, "Invalid ids len");
            for (uint256 i = 0; i < tokenIds.length; i++) {
                if (!(IERC1155(addr).balanceOf(seller, tokenIds[i]) >= amounts[i] && amounts[i] > 0)) {
                    return (false, "Invalid amount or balance");
                }
            }
        }
        return (true ,"");
    }

    function checkExclusive(address account, address token, uint256 amount) override public view returns (bool){
        if (amount > 0 && Address.isContract(token)) {
            if (IERC165(token).supportsInterface(0x80ac58cd)) {
                return IERC721(token).balanceOf(account) >= amount;
            }
            return IERC20(token).balanceOf(account) >= amount;
        }

        return true;
    }

    function getProtocolFeeRecipient()
        external
        view
        override
        returns (address)
    {
        return feeRecipient;
    }

    /**
    @notice get protocol fee for eache success TaskItem payment, default is 2%
    @return fee (200 = 25%, 1,000 = 10%)
    */
    function getProtocolFee() external view override returns (uint256) {
        return protocolFee;
    }

    /**
    @notice get Draw Delay second for security
     */
    function getDrawDelay() external view override returns (uint32) {
        return DRAW_DELAY_SEC;
    }

    /**
    @notice get ILucksVRF instance  
    */
    function getVRF() public view override returns (ILucksVRF) {
        return VRF;
    }

    /**
    @notice get ILucksGroup instance  
    */
    function getGROUPS() public view override returns (ILucksGroup) {
        return GROUPS;
    }

    /**
    @notice get ILucksPaymentStrategy instance  
    */
    function getSTRATEGY() public view override returns (ILucksPaymentStrategy) {
        return STRATEGY;
    }

    function getAutoClose() external view override returns (ILucksAuto) {
        return AUTO_CLOSE;
    }

    function getAutoDraw() external view override returns (ILucksAuto) {
        return AUTO_DRAW;
    }

    //  ============ onlyOwner  functions  ============

    /**
    @notice set operator
     */
    function setOperator(address addr, bool enable) external onlyOwner {
        operators[addr] = enable;
    }

    /**
    @notice set the ProtocolFeeRecipient
     */
    function setProtocolFeeRecipient(address addr) external onlyOwner {
        feeRecipient = addr;
    }

    /**
    @notice set protocol fee for eache success TaskItem payment, default is 5%
    @param fee fee (500 = 5%, 1,000 = 10%)
    */
    function setProtocolFee(uint256 fee) external onlyOwner {
        protocolFee = fee;
    }

    //  ============ onlyOwner & onlyOperator functions  ============

    /**
    @notice set the set MAX_PER_JOIN_NUM
     */
    function setJoinLimitNum(uint32 num) external onlyOperator {
        MAX_PER_JOIN_NUM = num;
    }

    /**
    @notice set Draw Delay for security
     */
    function setDrawDelay(uint32 second) external onlyOperator {
        DRAW_DELAY_SEC = second;
    }

    /**
    @notice set the acceptTokens
     */
    function setAcceptTokens(address[] memory tokens, bool enable)
        public
        onlyOperator
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            acceptTokens[tokens[i]] = enable;
        }
    }


    function setMinTargetAmount(address[] memory tokens, uint256[] memory amounts)
        public
        onlyOperator
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            minTargetAmount[tokens[i]] = amounts[i];
        }
    }

    /**
    @notice set the VRF
     */
    function setLucksVRF(ILucksVRF addr) external onlyOperator {
        VRF = addr;
    }

    /**
    @notice set the LucksGroup
     */
    function setLucksGroup(ILucksGroup addr) external onlyOperator {
        GROUPS = addr;
    }

    // /**
    // @notice set the LucksRewards
    //  */
    // function setLucksRewards(ILucksRewards addr) external onlyOperator {
    //     REWARDS = addr;
    // }

    /**
    @notice set the PaymentStrategy
     */
    function setPaymentStrategy(ILucksPaymentStrategy addr) external onlyOperator {
        STRATEGY = addr;
    }

    function setLucksAuto(ILucksAuto _auto_close, ILucksAuto _auto_draw) external onlyOperator {
        AUTO_CLOSE = _auto_close;
        AUTO_DRAW = _auto_draw;
    }
}
