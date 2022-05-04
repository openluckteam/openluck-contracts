//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Just for local testing
contract TokenUSDC is ERC20 {

    constructor()
        ERC20('TokenUSDC', 'USDC')
    {}
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}