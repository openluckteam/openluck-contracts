// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

// imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// interfaces
import {IProxyNFTStation, DepositNFT} from "./interfaces/IProxyNFTStation.sol";

contract ProxyNFTStation is IProxyNFTStation, ERC721Holder, ERC1155Holder, Ownable {

    using Counters for Counters.Counter;

    Counters.Counter private _depositIds;

    // ============ Public  ============    

    // interfaceID
    bytes4 public constant ID_ERC721 = 0x80ac58cd;  // ERC721    
    bytes4 public constant ID_ERC1155 = 0xd9b67a26; // ERC1155

    uint public DELAY_REDEEM_SEC = 172800; // 48 hours

    // OpenLuck executor
    address public immutable executor;

    // store user deposited nfts
    mapping(uint256 => DepositNFT) public deposits;


    modifier onlyExecutor() {
        require(msg.sender == executor, "Lucks: caller must be LucksExecutor.");
        _;
    }

    // ======== Constructor =========

    /**
     * @notice Constructor
     * @param _executor address
     */
    constructor(address _executor) {
       executor = _executor;
    }

    // ============ Public functions ============

    function deposit(address user, address nft, uint256[] memory tokenIds, uint256[] memory amounts, uint256 endTime) override external payable onlyExecutor 
        returns(uint256 depositId) { 

        // transfer nft to this contract
        _transferNFTs(nft, user, address(this), tokenIds, amounts);    

        // store deposit record
        _depositIds.increment();
        depositId = _depositIds.current();

        deposits[depositId] = DepositNFT(user, nft, tokenIds, amounts, endTime);
        
        emit Deposit(depositId, user, nft, tokenIds, amounts, endTime);   
    }

    function withdraw(uint256 depositId, address to) override external onlyExecutor {

        require(deposits[depositId].tokenIds.length > 0, "Invalid depositId");

        address nft = deposits[depositId].nftContract;
        uint256[] memory tokenIds = deposits[depositId].tokenIds;
        uint256[] memory amounts = deposits[depositId].amounts;

        // update storage
        delete deposits[depositId];

        // transfer out nft
        _transferNFTs(nft, address(this), to, tokenIds, amounts);

        emit Withdraw(depositId, to, nft, tokenIds, amounts);   
    }


    // for user to redeem
    // in case of cross chain deposit suck, user can redeem back nft after endTime
    function redeem(uint256 depositId, address to) override external {
        
        require(deposits[depositId].tokenIds.length > 0, "Invalid depositId");
        require(block.timestamp > deposits[depositId].endTime + DELAY_REDEEM_SEC, "Not time to redeem");
        require(deposits[depositId].user == to , "Invalid redeem to");

        address nft = deposits[depositId].nftContract;
        uint256[] memory tokenIds = deposits[depositId].tokenIds;
        uint256[] memory amounts = deposits[depositId].amounts;

        // update storage
        delete deposits[depositId];

        // transfer back nft to user
        _transferNFTs(nft, address(this), to, tokenIds, amounts);

        emit Redeem(depositId, to, nft, tokenIds, amounts);   
    }

    // ============ Internal functions ============

    /**
     * @notice batch transfer NFTs (seller/winner <-> protocol)
     * @param nft NFT contract address
     * @param from sender
     * @param to reciever
     * @param tokenIds tokenId array
     * @param amounts amounts array (ERC721 can be null)
     */
    function _transferNFTs(address nft, address from, address to, uint256[] memory tokenIds, uint256[] memory amounts) internal
    {
        require(nft != from && from != to, "Invalid address");

        if (IERC165(nft).supportsInterface(ID_ERC721)) {
            // transfer ERC721
            for (uint256 i = 0; i < tokenIds.length; i++) {
                IERC721(nft).transferFrom(from, to, tokenIds[i]);
            }
        } else if (IERC165(nft).supportsInterface(ID_ERC1155)) {
            // transfer ERC1155
            require(tokenIds.length == amounts.length, "Invalid ids & amounts");
            IERC1155(nft).safeBatchTransferFrom(from, to, tokenIds, amounts, "");
        }
    }

    //  ============ onlyOwner  functions  ============

    /**
    @notice set operator
     */
    function setRedeemDelay(uint second) external onlyOwner {
        DELAY_REDEEM_SEC = second;
    }
} 