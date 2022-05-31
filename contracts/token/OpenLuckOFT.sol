// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "layerzero-contracts/contracts/token/oft/OFT.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


contract OpenLuckOFT is OFT, Pausable {

    constructor(address _lzEndpoint) OFT("OpenLuckToken", "LUCK", _lzEndpoint) {
        
    }
    
    function _debitFrom(address _from, uint16 _dstChainId, bytes memory _toAddress, uint _amount) internal virtual override whenNotPaused {
        super._debitFrom(_from, _dstChainId, _toAddress, _amount);
    }

    function pauseSendTokens(bool pause) external onlyOwner {
        pause ? _pause() : _unpause();
    }
}
