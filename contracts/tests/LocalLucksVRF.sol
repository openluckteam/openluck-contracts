// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Chainlink contracts
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

// Openluck interfaces
import {ILucksVRF} from "./../interfaces/ILucksVRF.sol";

contract LocalLucksVRF is VRFConsumerBaseV2, ILucksVRF, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private currentNonce;   

    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // Rinkeby coordinator. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;

    // Rinkeby LINK token contract. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 keyHash =
        0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 callbackGasLimit = 100000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    address public executor;

    // taskId => ticket FinalNumber
    mapping(uint256 => uint32) public randomResults;
    // requestId => taskId
    mapping(uint256 => uint256) public requestToTaskId;
    // requestId => max num
    mapping(uint256 => uint256) public requestToMaxNum;
    // taskId => requestId
    mapping(uint256 => uint256) private taskToRequestId;

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        address _link,
        bytes32 _keyHash,
        address _executor
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        s_subscriptionId = _subscriptionId;
        vrfCoordinator = _vrfCoordinator;
        link = _link;
        keyHash = _keyHash;

        executor = _executor;
        // COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        // LINKTOKEN = LinkTokenInterface(link);
    }

    /**
     * @notice Request randomness from a user-provided max
     * @param max: max provided by the LucksExecutor (lastTicketId)
     */
    function reqRandomNumber(uint256 taskId, uint256 max) external override {
        require(msg.sender == owner() || msg.sender == executor, "Only Lucks can reqRandomNumber");
        require(max > 0, "Invalid max input");

        if (taskToRequestId[taskId] > 0) {
            return;
        }

        // Will revert if subscription is not set and funded.
        currentNonce.increment();
        uint64 nonce = uint64(currentNonce.current());
        (uint256 requestId,) = computeRequestId(
            keyHash,
            msg.sender,
            s_subscriptionId,
            nonce   
        );
        requestToTaskId[requestId] = taskId;
        requestToMaxNum[requestId] = max;
        taskToRequestId[taskId] = requestId;

        emit ReqRandomNumber(taskId, max, requestId);
    }

    /**
     * @notice View random result
     */
    function viewRandomResult(uint256 taskId)
        external
        view
        override
        returns (uint32)
    {
        return randomResults[taskId];
    }

    /**
     * @notice Callback function used by ChainLink's VRF Coordinator
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 taskId = requestToTaskId[requestId];        
        require(taskId > 0, "Wrong taskId or requestId");

        // Between 1 and max:
        randomResults[taskId] = uint32((randomWords[0] % requestToMaxNum[requestId]) + 1);

        emit RspRandomNumber(
            taskId,
            requestId,
            randomWords[0],
            randomResults[taskId]
        );
    }

    function computeRequestId(
        bytes32 _keyHash,
        address _sender,
        uint64 _subId,
        uint64 _nonce
    ) private pure returns (uint256, uint256) {
        uint256 preSeed = uint256(keccak256(abi.encode(_keyHash, _sender, _subId, _nonce)));
        return (uint256(keccak256(abi.encode(_keyHash, preSeed))), preSeed);
    }

    // ============ only Owner ============

    /**
     * @notice Callback for test & enmergency case
     */
    function callbackRandomWords(uint256 taskId, uint256 seed)
        external
        onlyOwner
    {    
        uint256 requestId = taskToRequestId[taskId];

        // generate random by owner
        uint256 random = uint256(
           keccak256(abi.encodePacked(
                seed *
                block.timestamp *
                block.difficulty *
                block.number *
                uint(blockhash(block.number - requestConfirmations))
            ))
        );

        // Between 1 and max:
        randomResults[taskId] = uint32((random % requestToMaxNum[requestId]) + 1);

        emit RspRandomNumber(
            taskId,
            requestId,
            random,
            randomResults[taskId]
        );       
    }


    /**
     * @notice Callback for test & enmergency case
     */
    function callbackTestRandomWords(uint256 taskId, uint32 number)
        external
        onlyOwner
    {              
        uint256 requestId = taskToRequestId[taskId];

        randomResults[taskId] = number;

        emit RspRandomNumber(
            taskId,
            requestId,
            number,
            randomResults[taskId]
        );
    }    

    /**
     * @notice Change the keyHash
     * @param _keyHash: new keyHash
     */
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    /**
     * @notice Change the requestConfirmations
     * @param num: num
     */
    function setReqConfirmations(uint16 num) external onlyOwner {
        requestConfirmations = num;
    }

    /**
     * @notice Set the address for the Lucks
     * @param _executor: address of the PancakeSwap crowdluck
     */
    function setLucksAddress(address _executor) external onlyOwner {
        executor = _executor;
    }
}
