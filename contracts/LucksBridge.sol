// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;
pragma abicoder v2;

// imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// OpenLuck
import "./interfaces/ILucksExecutor.sol";
import "./interfaces/ILucksBridge.sol";

// interfaces
import "./interfaces/ILayerZeroReceiver.sol";
import "./interfaces/ILayerZeroEndpoint.sol";
import "./interfaces/ILayerZeroUserApplicationConfig.sol";


contract LucksBridge is Ownable, ILucksBridge, ILayerZeroReceiver, ILayerZeroUserApplicationConfig {
    using SafeMath for uint256;
    //---------------------------------------------------------------------------
    // CONSTANTS
    uint8 internal constant TYPE_CREATE_TASK = 1;
    uint8 internal constant TYPE_WITHDRAW_NFT = 2;

    //---------------------------------------------------------------------------
    // VARIABLES
    ILayerZeroEndpoint public immutable layerZeroEndpoint;
    mapping(uint16 => bytes) public bridgeLookup;
    mapping(uint16 => mapping(uint8 => uint256)) public gasLookup;
    ILucksExecutor public immutable executor;
    bool public useLayerZeroToken;

    mapping(uint16 => mapping(bytes => mapping(uint64 => bytes))) public revertLookup; //[chainId][srcAddress][nonce]

    //---------------------------------------------------------------------------
    // MODIFIERS
    modifier onlyExecutor() {
        require(msg.sender == address(executor), "Lucks: caller must be LucksExecutor.");
        _;
    }

    constructor(address _layerZeroEndpoint, address _executor) {
        require(_layerZeroEndpoint != address(0x0), "Lucks: _layerZeroEndpoint cannot be 0x0");
        require(_executor != address(0x0), "Lucks: _executor cannot be 0x0");
        layerZeroEndpoint = ILayerZeroEndpoint(_layerZeroEndpoint);
        executor = ILucksExecutor(_executor);
    }

    // ============ EXTERNAL functions ============

    function lzReceive(
        uint16 _srcChainId, // the chainId that we are receiving the message from.
        bytes memory _srcAddress, // the source bridge address from
        uint64 _nonce,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(layerZeroEndpoint), "Lucks: only LayerZero endpoint can call lzReceive");
        require(
            _srcAddress.length == bridgeLookup[_srcChainId].length && keccak256(_srcAddress) == keccak256(bridgeLookup[_srcChainId]),
            "Lucks: bridge does not match"
        );

        uint8 functionType;
        assembly {
            functionType := mload(add(_payload, 32))
        }

        try executor.onLzReceive(functionType, _payload) {
            // do noting
        } catch(bytes memory reason) {
            // store error for future retry
            revertLookup[_srcChainId][_srcAddress][_nonce] = _payload;
            emit Revert(functionType, _srcChainId, _srcAddress, _nonce, reason);
        }
        
    }

    function retryRevert(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce
    ) external payable {
        bytes memory payload = revertLookup[_srcChainId][_srcAddress][_nonce];
        require(payload.length > 0, "Lucks: no retry revert");

        // empty it
        revertLookup[_srcChainId][_srcAddress][_nonce] = "";

        uint8 functionType;
        assembly {
            functionType := mload(add(payload, 32))
        }

        try executor.onLzReceive(functionType, payload) {            
            emit RetryResult(functionType, _srcChainId, _srcAddress, _nonce, true);
        } catch {
            // store error for future retry
            revertLookup[_srcChainId][_srcAddress][_nonce] = payload;
            emit RetryResult(functionType, _srcChainId, _srcAddress, _nonce, false);
        }
    }


    // return (nativeFee,zroFee)
    function quoteLayerZeroFee(
        uint16 _chainId,
        uint8 _functionType,           
        string memory _note,  
        lzTxObj memory _lzTxParams
    ) override external view returns (uint256, uint256) {
        bytes memory payload = "";
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 10000;
        amounts[1] = 10000;

        if (_functionType == TYPE_CREATE_TASK) {
                       
            TaskItem memory item = TaskItem(
                address(0), 0, address(0), amounts, amounts, 
                address(0), TaskStatus.Open, 
                block.timestamp, block.timestamp,
                1000e18,
                1e18,
                1, 
                ExclusiveToken(address(0), 1e18), 
                0,
                10000                
            );
            TaskExt memory ext = TaskExt(1, "nft collection item title", _note);

            payload = abi.encode(TYPE_CREATE_TASK, item, ext);

        } else if (_functionType == TYPE_WITHDRAW_NFT) {

            payload = abi.encode(TYPE_WITHDRAW_NFT, address(0), 10000);

        }  else {
            revert("Lucks: unsupported function type");
        }

        bytes memory lzTxParamBuilt = _txParamBuilder(_chainId, _functionType, _lzTxParams);
        return layerZeroEndpoint.estimateFees(_chainId, address(this), payload, useLayerZeroToken, lzTxParamBuilt);
    }

    function renounceOwnership() public override onlyOwner {}

    // ============  LOCAL CHAIN (send out message to destination chain)============

    function sendCreateTask(
        uint16 _dstChainId,
        address payable user,
        TaskItem memory item,
        TaskExt memory ext,
        lzTxObj memory _lzTxParams
    ) override external payable onlyExecutor {
        bytes memory payload = abi.encode(TYPE_CREATE_TASK, item, ext);
        _call(_dstChainId, TYPE_CREATE_TASK, user, _lzTxParams, payload);
    }

    function sendWithdrawNFTs(
        uint16 _dstChainId,
        address payable user,
        uint256 depositId, 
        lzTxObj memory _lzTxParams
    ) override external payable onlyExecutor {
        bytes memory payload = abi.encode(TYPE_WITHDRAW_NFT, user, depositId);
        _call(_dstChainId, TYPE_WITHDRAW_NFT, user, _lzTxParams, payload);
    }

    // ============ dao functions ============

    function setBridge(uint16 _chainId, bytes calldata _bridgeAddress) external onlyOwner {
        // require(bridgeLookup[_chainId].length == 0, "Lucks: Bridge already set!");
        bridgeLookup[_chainId] = _bridgeAddress;
    }

    function setGasAmount(
        uint16 _chainId,
        uint8 _functionType,
        uint256 _gasAmount
    ) external onlyOwner {
        require(_functionType >= 1 && _functionType <= 4, "Lucks: invalid _functionType");
        gasLookup[_chainId][_functionType] = _gasAmount;
    }

    function setUseLayerZeroToken(bool enable) external onlyOwner {
        useLayerZeroToken = enable;
    }

    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external override onlyOwner {
        layerZeroEndpoint.forceResumeReceive(_srcChainId, _srcAddress);
    }

    // ============ generic config for user Application ============

    function setConfig(
        uint16 _version,
        uint16 _chainId,
        uint256 _configType,
        bytes calldata _config
    ) external override onlyOwner {
        layerZeroEndpoint.setConfig(_version, _chainId, _configType, _config);
    }

    function setSendVersion(uint16 version) external override onlyOwner {
        layerZeroEndpoint.setSendVersion(version);
    }

    function setReceiveVersion(uint16 version) external override onlyOwner {
        layerZeroEndpoint.setReceiveVersion(version);
    }

    // ============ INTERNAL functions ============

    function txParamBuilderType1(uint256 _gasAmount) internal pure returns (bytes memory) {
        uint16 txType = 1;
        return abi.encodePacked(txType, _gasAmount);
    }

    function txParamBuilderType2(
        uint256 _gasAmount,
        uint256 _dstNativeAmount,
        bytes memory _dstNativeAddr
    ) internal pure returns (bytes memory) {
        uint16 txType = 2;
        return abi.encodePacked(txType, _gasAmount, _dstNativeAmount, _dstNativeAddr);
    }

    function _txParamBuilder(
        uint16 _chainId,
        uint8 _type,
        lzTxObj memory _lzTxParams
    ) internal view returns (bytes memory) {
        bytes memory lzTxParam;
        address dstNativeAddr;
        {
            bytes memory dstNativeAddrBytes = _lzTxParams.dstNativeAddr;
            assembly {
                dstNativeAddr := mload(add(dstNativeAddrBytes, 20))
            }
        }

        uint256 totalGas = gasLookup[_chainId][_type].add(_lzTxParams.dstGasForCall);
        if (_lzTxParams.dstNativeAmount > 0 && dstNativeAddr != address(0x0)) {
            lzTxParam = txParamBuilderType2(totalGas, _lzTxParams.dstNativeAmount, _lzTxParams.dstNativeAddr);
        } else {
            lzTxParam = txParamBuilderType1(totalGas);
        }

        return lzTxParam;
    }

    function _call(
        uint16 _chainId, // dst chainId
        uint8 _type, // function type
        address payable user, // user address
        lzTxObj memory _lzTxParams,
        bytes memory _payload
    ) internal {
        bytes memory lzTxParamBuilt = _txParamBuilder(_chainId, _type, _lzTxParams);
        uint64 nextNonce = layerZeroEndpoint.getOutboundNonce(_chainId, address(this)) + 1;
        layerZeroEndpoint.send{value: msg.value}(_chainId, bridgeLookup[_chainId], _payload, user, address(this), lzTxParamBuilt);
        
        emit SendMsg(_type, nextNonce);
    }
}
