// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AggregatorV3Interface.sol";

interface ITokenPrices {

  struct TokenFeed {    
    uint256 decimals;    
    AggregatorV3Interface feed;
  }

  event AddFeed(string currency, string token, uint256 decimals, AggregatorV3Interface feed);

  function getPrice(string memory currency, string memory token) external view returns (uint256);

  function getPrices(string memory currency, string[] memory tokens) external view returns (uint256[] memory);

  function getFeed(string memory currency, string memory token) external view returns (TokenFeed memory);

  function addFeed(string memory currency, string memory token, uint256 decimals, AggregatorV3Interface priceFeed) external;
}
