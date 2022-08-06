//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Just for local testing
contract TokenERC20ETH is ERC20 {

    constructor()
        ERC20('TokenETH', 'ETH')
    {}
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}