//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Just for local testing
contract TokenUSDT is ERC20 {

    constructor()
        ERC20('TokenUSDT', 'USDT')
    {}
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}