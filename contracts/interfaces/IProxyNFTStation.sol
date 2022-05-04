// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

struct DepositNFT {
    address user; // deposit user
    address nftContract; // NFT registry address    
    uint256[] tokenIds; // Allow mulit nfts for sell    
    uint256[] amounts; // support ERC1155
    uint256 endTime; // Task end time
}

interface IProxyNFTStation {

    event Deposit(uint256 depositId, address indexed user, address nft, uint256[] tokenIds, uint256[] amounts, uint256 endTime);
    event Withdraw(uint256 depositId, address indexed to, address nft, uint256[] tokenIds, uint256[] amounts);
    event Redeem(uint256 depositId, address indexed to, address nft, uint256[] tokenIds, uint256[] amounts);

    function deposit(address user, address nft, uint256[] memory tokenIds, uint256[] memory amounts, uint256 endTime) external payable returns (uint256 depositId);    
    function withdraw(uint256 depositId, address to) external;    
    function redeem(uint256 depositId, address to) external;    
}