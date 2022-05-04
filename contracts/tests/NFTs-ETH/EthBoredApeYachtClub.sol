
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EthBoredApeYachtClub is ERC721, Ownable {

    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string public baseURI = 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/';

    constructor(address mintTo, uint num) ERC721("BoredApeYachtClub", "BAYC")  {
        mint(mintTo, num);
    }

    function mint(address to, uint num) public {
        for (uint i = 0; i < num; i++) {
            safeMint(to);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Nonexistent token");

        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function safeMint(address to) public {        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
}