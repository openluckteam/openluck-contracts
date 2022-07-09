// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// interfaces
import {IProxyTokenStation} from "./interfaces/IProxyTokenStation.sol";
import {IWETH} from "./interfaces/IWETH.sol";

contract ProxyTokenStation is IProxyTokenStation, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Public  ============    

    uint public GAS_LIMIT = 100000;
   
    // OpenLuck executors
    mapping(address => bool) public executors;

    // support multiple executors (executor-address => token address => amount)    
    mapping(address => mapping(address => uint256)) public deposits;

    address public WETH;
   
    modifier onlyExecutor() {
        require(executors[msg.sender] == true, "Lucks: onlyExecutor");
        _;
    }

    // ======== Constructor =========

    /**
     * @notice Constructor
     * @param _executor executor address
     */
    constructor(address _executor, address _weth) {
        executors[_executor] = true;
        WETH = _weth;
    }

    // ============ external functions ============

    function deposit(address user, address token, uint256 amount) override external payable onlyExecutor {
        
        _deposit(msg.sender, user, token, amount);
        
        emit Deposit(msg.sender, user, token, amount);        
    }

    function withdraw(address user, address token, uint256 amount) override external onlyExecutor {

        _withdraw(msg.sender, user, token, amount);

        emit Withdraw(msg.sender, user, token, amount);   
    }

    // ============ Internal functions ============

    function _deposit(address executor, address user, address token, uint256 amount) internal {
        //zero address means Chain Navite Token, support ETH+WETH
         if (token == address(0)) { 
            // allow ETH+WETH
            uint256 wrapTokenAmount = amount.sub(msg.value);
            require(wrapTokenAmount >= 0, "deposit: Msg.value too high");
            if (wrapTokenAmount > 0) {
                require(address(WETH) != address(0), "wrapp token not set or msg.value too small");
                require(IERC20(WETH).balanceOf(user) >= wrapTokenAmount, "Insufficient balance");
                require(IERC20(WETH).allowance(user, address(this)) >= wrapTokenAmount, "Insufficient allowance");       
                // Transfer WETH to this contract
                IERC20(WETH).transferFrom(user, address(this), wrapTokenAmount);
                // transfer WETH to ETH
                IWETH(WETH).withdraw(wrapTokenAmount);

            }
            
        } else {
            require(IERC20(token).balanceOf(user) >= amount, "Insufficient token balance");
            require(IERC20(token).allowance(user, address(this)) >= amount, "Insufficient token allowance");
            // Transfer tokens to this contract
            IERC20(token).transferFrom(user, address(this), amount);
        }

        // update deposits balance
        deposits[executor][token] = deposits[executor][token].add(amount);
    }

    function _withdraw(address executor, address user, address token, uint256 amount) internal {
        
        require(user != address(0) && user != address(this), "Invalid address");
        require(amount > 0, "amount");
        require(deposits[executor][token] >= amount, "Insufficient deposited balance for this executor");

        // update deposits balance
        deposits[executor][token] = deposits[executor][token].sub(amount);

        // transfer
        if (token == address(0)) {    
            require(address(this).balance >= amount, "Lack of funds");  

            // transfer funds 
            if (Address.isContract(user)) {
                (bool state,) = address(user).call{ value: amount, gas: GAS_LIMIT}("");
                require(state, "send value failed");                
            }
            else {
                payable(user).transfer(amount);  
            }                  

        } else {        
            require(IERC20(token).balanceOf(address(this)) >= amount, "Lack of token");
            // Transfer tokens                
            IERC20(token).transfer(user, amount);
        }
    }

    /**
    @notice set operator
     */
    function setExecutor(address executor) external onlyOwner {
        executors[executor] = true;
    }


    /**
    @notice set IWETH
     */
    function setWETH(address _eth) external onlyOwner {
        WETH = _eth;
    }

    function setGasLimit(uint amount) external onlyOwner {
        GAS_LIMIT = amount;
    }
} 