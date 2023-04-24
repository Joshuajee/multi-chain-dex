// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexV1PairNative.sol';
import './interfaces/IMDexV1CloneFactory.sol';
import './interfaces/IMDexV1NativeFactory.sol';
import './MDexV1PairNative.sol';
import 'hardhat/console.sol';


contract MDexV1NativeFactory is HyperlaneConnectionClient, IMDexV1NativeFactory {

    //Events
    event PairCreated(uint32 indexed remoteDomain, address indexed remoteAddress, address indexed pair, uint pairCount);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    address public clonefactory;

    uint32 public LOCAL_DOMAIN;

    mapping(uint => mapping(uint => address)) public getPair;
    address[] public allPairs;


    //store open positions in mapping and array, with counter to track them
    uint public positionCounter = 0;
    mapping(uint => LiquidityToken) public positions;
    mapping(address => uint) public pendingPosition;
    Liquidity.Map private myPendingPositions;
    uint[] public openPositionArray;

    // using iterable mapping to store positions
    Liquidity.Map private myOpenedPositions;
    Liquidity.Map private myClosedPositions;

    //Modifiers
    modifier isPayingEnoughGas(uint _gasAmount, uint _amountIn1, uint32 _remoteDomain) {
        uint quote = quoteGasPayment(_remoteDomain, _gasAmount);
        if (_amountIn1 + quote > msg.value) revert("MDEX: INSUFFIENT GAS");
        _;
    }


    constructor(uint32 _domain, address _cloneFactory) {
        LOCAL_DOMAIN = _domain;
        clonefactory = _cloneFactory;
    }

    function initialize(address _mailbox, address _interchainGasPaymaster) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster
        );
    }

    function _getGas(uint _amountIn1) internal view returns(uint) {
        return msg.value - _amountIn1;
    }

    function _generateId(address _sender) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(_sender, positionCounter));
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function contractFactory (uint32 _remoteDomain, address _remoteAddress) internal returns (address pair) {
        
        pair = IMDexV1CloneFactory(clonefactory).nativeCloneFactory(LOCAL_DOMAIN, _remoteDomain, _remoteAddress);

        IMDexV1PairNative(pair).initialize(
            address(mailbox), 
            address(interchainGasPaymaster)
        ); 

        getPair[LOCAL_DOMAIN][ _remoteDomain] = pair;
        getPair[ _remoteDomain][LOCAL_DOMAIN] = pair; 
        allPairs.push(pair);

    }

    function createPair(
        uint32 _remoteDomain, 
        uint _amountIn1, 
        uint _amountIn2, 
        uint _gasAmount, 
        address _remoteAddress) external payable isPayingEnoughGas(_gasAmount, _amountIn1, _remoteDomain) returns (address pair) {

        {
            if (LOCAL_DOMAIN == _remoteDomain) revert('MDEX: IDENTICAL_CHAIN');

            (uint32 chainA, uint32 chainB) = LOCAL_DOMAIN <  _remoteDomain ? (LOCAL_DOMAIN,  _remoteDomain) : ( _remoteDomain, LOCAL_DOMAIN);

            if (getPair[chainA][chainB] != address(0)) revert('MDEX: ALREADY EXISTS');

        }

        pair = contractFactory(_remoteDomain, address(0));

        bytes32 messageId = IMailbox(mailbox).dispatch(
            _remoteDomain,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("createPairReceiver(uint32,uint256,uint256,address)", LOCAL_DOMAIN, _amountIn1, _amountIn2, pair)
        );

        {
            (bool success, ) = payable(pair).call{ value: _amountIn1}("");

            if (!success) revert("MDEX: Transaction Failed");
        }

        IMDexV1PairNative(pair).addLiquidityCore(_generateId(msg.sender), _amountIn1, _amountIn2, msg.sender);

        payForGas(messageId, _remoteDomain, _gasAmount,  msg.value - _amountIn1);
        
        emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);
    
    }


    function addLiquidity(uint32 _remoteDomain, uint _amountIn1, uint _amountIn2, uint _gasAmount, address _remoteAddress) external payable {

        bytes32 messageId = mailbox.dispatch(
            _remoteDomain,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("addLiquidityReceiver(bytes32,uint32,uint256,uint256,address,address)", _generateId(msg.sender), LOCAL_DOMAIN, _amountIn1, _amountIn2, msg.sender, address(this))
        );

        payForGas(messageId, _remoteDomain, _gasAmount, _getGas(_amountIn1));

        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

        IMDexV1PairNative(pair).addLiquidityCore(_generateId(msg.sender), _amountIn1, _amountIn2, msg.sender);   

    }


    // =========== Receivers =============

    function createPairReceiver(uint32 _remoteDomain,  uint256 _amountIn1, uint256 _amountIn2,  address _remoteAddress) external onlyMailbox returns (address pair) {
        pair = contractFactory(_remoteDomain,  _remoteAddress);
            
        IMDexV1PairNative(pair).addLiquidityCore(_generateId(msg.sender), _amountIn2, _amountIn1, msg.sender);   

        console.log("done");
        emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);
    }

    function addLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, uint256 _amountIn1, uint256 _amountIn2, address _sender, address _remoteAddress) external onlyMailbox {
        
        console.log("RECEIVED", _remoteDomain, _remoteAddress);

        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

        IMDexV1PairNative(pair).addLiquidityCore(_id, _amountIn1, _amountIn2, _sender);   

    }

    function swapReceiver(uint256 _amountIn, address  _to) external onlyMailbox  {

        // uint amountOut = getPrice(_amountIn);

        // (bool success, ) = payable(_to).call{value: amountOut}("MDEX: SWAP_SUCCESSFUL");

        // if (!success) revert("MDEX: SWAP_FAILED");

    }

    // gas payment
    function payForGas(bytes32 _messageId, uint32 _remoteDomain, uint256 _gasAmount, uint _gas) public payable {
        
        IInterchainGasPaymaster(interchainGasPaymaster).payForGas{ value: _gas }(
            _messageId, // The ID of the message that was just dispatched
            _remoteDomain, // The remote domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            msg.sender // refunds go to msg.sender, who paid the msg.value
        );

    }

    // get gas info
    function quoteGasPayment(uint32 _remoteDomain, uint256 _gasAmount) public view returns (uint256) {
        return IInterchainGasPaymaster(interchainGasPaymaster).quoteGasPayment(_remoteDomain, _gasAmount);
    }

    // hyperlane message handler
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external onlyMailbox  {        
        address sender = _sender.bytes32ToAddress();
        (bool success,) = address(this).delegatecall(_body);
        if (!success) revert("MDEX: Transaction Failed");
        emit ReceivedMessage(_origin, sender, _body);
    }

}
