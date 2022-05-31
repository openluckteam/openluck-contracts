// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "layerzero-contracts/contracts/token/oft/extension/BasedOFT.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


contract OpenLuckToken is BasedOFT, Pausable {

    uint256 public immutable SUPPLY_CAP;

    /**
     * @notice Constructor
     * @param _lzEndpoint _lzEndpoint address
     * @param _premintReceiver address that receives the premint
     * @param _premintAmount amount to premint
     * @param _cap supply cap (to prevent abusive mint)
     */
    constructor(
        address _lzEndpoint,
        address _premintReceiver,
        uint256 _premintAmount,
        uint256 _cap
    ) BasedOFT("OpenLuckToken", "LUCK", _lzEndpoint) {    
        require(_cap > _premintAmount, "Cap limit");  
        _mint(_premintReceiver, _premintAmount);
        SUPPLY_CAP = _cap;
    }

    /**
     * @notice Mint tokens
     * @param account address to receive tokens
     * @param amount amount to mint
     * @return status true if mint is successful, false if not
     */
    function mint(address account, uint256 amount) external onlyOwner returns (bool status) {
        if (totalSupply() + amount <= SUPPLY_CAP) {
            _mint(account, amount);
            return true;
        }
        return false;
    }

    function _debitFrom(address _from, uint16 _dstChainId, bytes memory _toAddress, uint _amount) internal virtual override whenNotPaused {
        super._debitFrom(_from, _dstChainId, _toAddress, _amount);
    }

    function pauseSendTokens(bool pause) external onlyOwner {
        pause ? _pause() : _unpause();
    }
}
