// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexPairNative.sol';
import './MDexPairNative.sol';


contract MDexFactory is HyperlaneConnectionClient, IInterchainGasPaymaster, IMDexPairNative {

    //Events
    event PairCreated(uint32 indexed chain1, uint32 indexed chain2, address pair, uint);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    IInterchainGasPaymaster igp = IInterchainGasPaymaster(interchainGasPaymaster);

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

    function contractFactory (uint32 _destinationDomain, address _destinationAddress, bytes32 _salt) internal returns (address pair) {
        
        pair = address(
            new MDexPairNative {salt: _salt} (
                LOCAL_DOMAIN,
                _destinationDomain, 
                _destinationAddress 
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

    function createPair(uint32 _destinationDomain, uint _gasAmount, address _destinationAddress) external returns (address pair) {

        if (LOCAL_DOMAIN == _destinationDomain) revert('MDEX: IDENTICAL_CHAIN');

        (uint32 chainA, uint32 chainB) = LOCAL_DOMAIN <  _destinationDomain ? (LOCAL_DOMAIN,  _destinationDomain) : ( _destinationDomain, LOCAL_DOMAIN);

        if (getPair[chainA][chainB] != address(0)) revert('MDEX: IDENTICAL_CHAIN');

        bytes32 salt = keccak256(abi.encodePacked(LOCAL_DOMAIN, _destinationDomain, block.timestamp));

        pair = contractFactory(_destinationDomain, _destinationAddress, salt);

        bytes32 messageId = mailbox.dispatch(
            LOCAL_DOMAIN,
            _destinationAddress.addressToBytes32(),
            abi.encodeWithSignature('createPairReceiver(uint32 _destinationDomain,address _destinationAddress,bytes32 _salt)', LOCAL_DOMAIN, salt, address(this))
        );

        payForGas(messageId, _destinationDomain, _gasAmount, msg.sender);
        
        emit PairCreated(LOCAL_DOMAIN,  _destinationDomain, pair, allPairs.length);
    
    }

    function createPairReceiver(uint32 _destinationDomain, address _destinationAddress, bytes32 _salt) internal returns (address pair) {

        pair = contractFactory(_destinationDomain, _destinationAddress, _salt);
    
        emit PairCreated(LOCAL_DOMAIN,  _destinationDomain, pair, allPairs.length);
    
    }

    // gas payment
    function payForGas(
        bytes32 _messageId, 
        uint32 _destinationDomain, 
        uint256 _gasAmount,
        address _refundAddress
        ) public payable {
        
        igp.payForGas{ value: msg.value }(
            _messageId, // The ID of the message that was just dispatched
            _destinationDomain, // The destination domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            _refundAddress // refunds go to msg.sender, who paid the msg.value
        );

    }

    // get gas info
    function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) external view returns (uint256) {
        return igp.quoteGasPayment(_destinationDomain, _gasAmount);
    }

    // hyperlane message handler
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external onlyMailbox {
        
        address sender = _sender.bytes32ToAddress();

        (bool success, ) = address(this).call{value: 0}(_body);

        if (!success) revert("MDEX: Transaction Failed");

        emit ReceivedMessage(_origin, sender, _body);

    }

}
