// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexPairNative.sol';
import './MDexV1PairNative.sol';


contract MDexV1NativeFactory is HyperlaneConnectionClient, IInterchainGasPaymaster, IMDexPairNative {

    //Events
    event PairCreated(uint32 indexed chain1, uint32 indexed chain2, address indexed pair, uint kValue, uint pairCount);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    uint32 public LOCAL_DOMAIN;

    // supported chain ID and name this is the Hyperlane ID
    mapping(uint => string) public supportedChainId;

    mapping(uint => mapping(uint => address)) public getPair;
    address[] public allPairs;

    constructor(uint32 _domain) {
        LOCAL_DOMAIN = _domain;
    }

    function initialize(address _mailbox, address _interchainGasPaymaster, address _interchainSecurityModule) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster, 
            _interchainSecurityModule, 
            msg.sender
        );
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function contractFactory (uint32 _destinationDomain, uint _kValue, address _remoteAddress) internal returns (address pair) {
        
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, LOCAL_DOMAIN));

        pair = address(
            new MDexV1PairNative {salt: salt} (
                LOCAL_DOMAIN,
                _destinationDomain, 
                _kValue,
                _remoteAddress 
            )
        );

        IMDexPairNative(pair).initialize(
            address(mailbox), 
            address(interchainGasPaymaster), 
            address(interchainSecurityModule)
        ); 

        getPair[LOCAL_DOMAIN][ _destinationDomain] = pair;
        getPair[ _destinationDomain][LOCAL_DOMAIN] = pair; 
        allPairs.push(pair);

        return pair;
    }

    function createPair(uint32 _destinationDomain, uint256 _kValue,  uint _gasAmount, address _destinationAddress) external payable returns (address pair) {

        if (LOCAL_DOMAIN == _destinationDomain) revert('MDEX: IDENTICAL_CHAIN');

        (uint32 chainA, uint32 chainB) = LOCAL_DOMAIN <  _destinationDomain ? (LOCAL_DOMAIN,  _destinationDomain) : ( _destinationDomain, LOCAL_DOMAIN);

        if (getPair[chainA][chainB] != address(0)) revert('MDEX: ALREADY EXISTS');

        pair = contractFactory(_destinationDomain, _kValue, address(0));

        bytes32 messageId = IMailbox(mailbox).dispatch(
            LOCAL_DOMAIN,
            _destinationAddress.addressToBytes32(),
            abi.encodeWithSignature("createPairReceiver(uint32,uint256,address)", LOCAL_DOMAIN, _kValue, pair)
        );

        payForGas(messageId, _destinationDomain, _gasAmount, msg.sender);
        
        emit PairCreated(LOCAL_DOMAIN,  _destinationDomain, pair, _kValue, allPairs.length);
    
    }

    function createPairReceiver(uint32 _destinationDomain, uint256 _kValue, address _remoteAddress) external onlyMailbox returns (address pair) {

        pair = contractFactory(_destinationDomain, _kValue, _remoteAddress);
    
        emit PairCreated(LOCAL_DOMAIN, _destinationDomain, pair, _kValue, allPairs.length);
    
    }

    // gas payment
    function payForGas(
        bytes32 _messageId, 
        uint32 _destinationDomain, 
        uint256 _gasAmount,
        address _refundAddress
        ) public payable {
        
        IInterchainGasPaymaster(interchainGasPaymaster).payForGas{ value: msg.value }(
            _messageId, // The ID of the message that was just dispatched
            _destinationDomain, // The destination domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            _refundAddress // refunds go to msg.sender, who paid the msg.value
        );

    }

    // get gas info
    function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) external view returns (uint256) {
        return IInterchainGasPaymaster(interchainGasPaymaster).quoteGasPayment(_destinationDomain, _gasAmount);
    }

    // hyperlane message handler
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external onlyMailbox  {
        
        address sender = _sender.bytes32ToAddress();

        (bool success,) = address(this).delegatecall(_body);

        if (!success) revert("MDEX: Transaction Failed");

        emit ReceivedMessage(_origin, sender, _body);

    }

}
