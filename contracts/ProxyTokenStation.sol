// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

// imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// interfaces
import {IProxyTokenStation} from "./interfaces/IProxyTokenStation.sol";
import {IWETH} from "./interfaces/IWETH.sol";

contract ProxyTokenStation is IProxyTokenStation, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Public  ============    
   
    address public immutable executor;  // OpenLuck executor
    address public immutable WETH;
   
    modifier onlyExecutor() {
        require(msg.sender == executor, "Lucks: caller must be LucksExecutor.");
        _;
    }

    // ======== Constructor =========

    /**
     * @notice Constructor
     * @param _executor executor address
     */
    constructor(address _executor, address _weth) {
        executor = _executor;
        WETH = _weth;
    }

    // ============ external functions ============

    function deposit(address user, address token, uint256 amount) override external payable onlyExecutor {
        
        _deposit(user, token, amount);
        
        emit Deposit(user, token, amount);        
    }

    function withdraw(address user, address token, uint256 amount) override external onlyExecutor {

        _withdraw(user, token, amount);

        emit Withdraw(user, token, amount);   
    }

    // ============ Internal functions ============

    function _deposit(address user, address token, uint256 amount) internal {
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
    }

    function _withdraw(address user, address token, uint256 amount) internal {
        
        require(user != address(0) && user != address(this), "Invalid address");
        require(amount > 0, "Invalid amount");

        // transfer
        if (token == address(0)) {    
            require(address(this).balance >= amount, "Lack of funds");       
            // transfer funds 
            payable(user).transfer(amount);                      
        } else {        
            require(IERC20(token).balanceOf(address(this)) >= amount, "Lack of token");
            // Transfer tokens                
            IERC20(token).transfer(user, amount);
        }
    }
} 