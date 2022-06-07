// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@paulrberg/contracts/math/PRBMath.sol';
import "./interfaces/AggregatorV3Interface.sol";
import "./interfaces/ITokenPrices.sol";

error PRICE_FEED_NOT_FOUND();

/** 
  @notice Manages and normalizes price feeds.
*/
contract TokenPrices is ITokenPrices, Ownable {

  mapping(string => mapping(string => TokenFeed)) public feeders;  

  function getPrice(string memory currency, string memory token) override public view returns (uint256) {

    TokenFeed memory tokenFeed = feeders[currency][token];

     // If the currency is the base, return 1 since they are priced the same. Include the desired number of decimals.
    if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked(token))) return 10**tokenFeed.decimals;

    // If it exists, return the price.
    if (address(tokenFeed.feed) != address(0)) return currentPrice(tokenFeed.feed, tokenFeed.decimals);

    // Get the inverse tokenFeed.
    tokenFeed = feeders[token][currency];

    // If it exists, return the inverse price.
    if (address(tokenFeed.feed) != address(0))
      return PRBMath.mulDiv(10**tokenFeed.decimals, 10**tokenFeed.decimals, currentPrice(tokenFeed.feed, tokenFeed.decimals));

    // No price feed available, revert.
    revert PRICE_FEED_NOT_FOUND();
  }

  function getPrices(string memory currency, string[] memory tokens) override external view returns (uint256[] memory) {
    uint256[] memory prices = new uint256[](tokens.length);
    for(uint i=0; i < tokens.length; i++) { 
      prices[i] = getPrice(currency, tokens[i]);
    }
    return prices;
  }

  function getFeed(string memory currency, string memory token) override external view returns (TokenFeed memory){
    return feeders[currency][token];
  }

  function addFeed(string memory currency, string memory token, uint256 decimals, AggregatorV3Interface priceFeed) override external onlyOwner {
    
    feeders[currency][token] = TokenFeed(decimals, priceFeed);

    emit AddFeed(currency, token, decimals, priceFeed);
  }


  function currentPrice(AggregatorV3Interface feed, uint256 decimals) internal view returns (uint256) {
    // Get the latest round information. Only need the price is needed.
    (, int256 price, , , ) = feed.latestRoundData();

    // Get a reference to the number of decimals the feed uses.
    uint256 _feedDecimals = feed.decimals();

    // Return the price, adjusted to the target decimals.
    return adjustDecimals(uint256(price), _feedDecimals, decimals);
  }

  function adjustDecimals(
    uint256 _value,
    uint256 _decimals,
    uint256 _targetDecimals
  ) internal pure returns (uint256) {
    // If decimals need adjusting, multiply or divide the price by the decimal adjuster to get the normalized result.
    if (_targetDecimals == _decimals) return _value;
    else if (_targetDecimals > _decimals) return _value * 10**(_targetDecimals - _decimals);
    else return _value / 10**(_decimals - _targetDecimals);
  }
}
