// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexPairNative.sol';
import './interfaces/IMDexV1CloneFactory.sol';
import './MDexV1PairNative.sol';


contract MDexV1NativeFactory is HyperlaneConnectionClient, IInterchainGasPaymaster, IMDexPairNative {

    //Events
    event PairCreated(uint32 indexed remoteDomain, address indexed remoteAddress, address indexed pair, uint pairCount);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    address public clonefactory;

    uint32 public LOCAL_DOMAIN;

    // supported chain ID and name this is the Hyperlane ID
    mapping(uint => string) public supportedChainId;

    mapping(uint => mapping(uint => address)) public getPair;
    address[] public allPairs;

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

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function contractFactory (uint32 _remoteDomain, address _remoteAddress) internal returns (address pair) {
        
        pair = IMDexV1CloneFactory(clonefactory).nativeCloneFactory(LOCAL_DOMAIN, _remoteDomain, _remoteAddress);

        IMDexPairNative(pair).initialize(
            address(mailbox), 
            address(interchainGasPaymaster)
        ); 

        getPair[LOCAL_DOMAIN][ _remoteDomain] = pair;
        getPair[ _remoteDomain][LOCAL_DOMAIN] = pair; 
        allPairs.push(pair);

    }

    function createPair(uint32 _remoteDomain, uint _gasAmount, address _remoteAddress) external payable returns (address pair) {

        if (LOCAL_DOMAIN == _remoteDomain) revert('MDEX: IDENTICAL_CHAIN');

        (uint32 chainA, uint32 chainB) = LOCAL_DOMAIN <  _remoteDomain ? (LOCAL_DOMAIN,  _remoteDomain) : ( _remoteDomain, LOCAL_DOMAIN);

        if (getPair[chainA][chainB] != address(0)) revert('MDEX: ALREADY EXISTS');

        pair =  contractFactory(_remoteDomain, address(0));

        bytes32 messageId = IMailbox(mailbox).dispatch(
            LOCAL_DOMAIN,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("createPairReceiver(uint32,address)", LOCAL_DOMAIN, pair)
        );

        payForGas(messageId, _remoteDomain, _gasAmount, msg.sender);
        
        emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);
    
    }

    function createPairReceiver(uint32 _remoteDomain,  address _remoteAddress) external onlyMailbox returns (address pair) {

        pair = contractFactory(_remoteDomain,  _remoteAddress);
    
        emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);
    
    }

    // gas payment
    function payForGas(
        bytes32 _messageId, 
        uint32 _remoteDomain, 
        uint256 _gasAmount,
        address _refundAddress
        ) public payable {
        
        IInterchainGasPaymaster(interchainGasPaymaster).payForGas{ value: msg.value }(
            _messageId, // The ID of the message that was just dispatched
            _remoteDomain, // The remote domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            _refundAddress // refunds go to msg.sender, who paid the msg.value
        );

    }

    // get gas info
    function quoteGasPayment(uint32 _remoteDomain, uint256 _gasAmount) external view returns (uint256) {
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
