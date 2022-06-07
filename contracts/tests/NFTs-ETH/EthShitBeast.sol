
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EthShitBeast is ERC721, Ownable {

    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string public baseURI = 'https://metadata.pieceofshit.wtf/shitbeast/02372da9-ea1b-4bb3-9ff8-f1f89c6a98ed/json/';

    constructor(address mintTo, uint num) ERC721("ShitBeast", "SB")  {
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

        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function safeMint(address to) public {     
        require(balanceOf(to) <=3 , 'owner count out of bounds');

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId <= 10000, "over cap");
       
        _safeMint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
}