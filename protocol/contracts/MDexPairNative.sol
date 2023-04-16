// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexPairNative.sol';



contract MDexPairNative is  HyperlaneConnectionClient, IMDexPairNative {

    //Events
    event Swap(address indexed to, uint amountIn, uint amountOut);
    event Sync(uint reserve1, uint reserve2);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    IInterchainGasPaymaster igp = IInterchainGasPaymaster(interchainGasPaymaster);

    uint public constant MINIMUM_LIQUIDITY = 10**3;

    address public factory;
    address public remoteAddress;

    uint32 public LOCAL_DOMAIN;
    uint32 public REMOTE_DOMAIN;

    uint private reserve1;       
    uint private reserve2;  
            
    uint32 private blockTimestampLast; 

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kValue; // 

    uint private unlocked = 1;

    // Modifiers
    modifier lock() {
        require(unlocked == 1, 'MDEX: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function getReserves() public view returns (uint _reserve1, uint _reserve2, uint32 _blockTimestampLast) {
        _reserve1 = reserve1;
        _reserve2 = reserve2;
        _blockTimestampLast = blockTimestampLast;
    }


    constructor(uint32 _LOCAL_DOMAIN, uint32 _REMOTE_DOMAIN, address _destinationAddress) {
        remoteAddress = _destinationAddress;
        factory = msg.sender;
        LOCAL_DOMAIN = _LOCAL_DOMAIN;
        REMOTE_DOMAIN = _REMOTE_DOMAIN;
    }

    function initialize(address _mailbox, address _interchainGasPaymaster, address _interchainSecurityModule) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster, 
            _interchainSecurityModule, 
            msg.sender
        );
    }

    // // update reserves and, on the first call per block, price accumulators
    // function _update(uint balance1, uint balance2, uint _reserve1, uint _reserve2) private {
     
    //     uint32 blockTimestamp = uint32(block.timestamp);

    //     uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

    //     if (timeElapsed > 0 && _reserve1 != 0 && _reserve2 != 0) {
    //         // * never overflows, and + overflow is desired
    //         price0CumulativeLast += uint(_reserve2) / (_reserve1) * timeElapsed;
    //         price1CumulativeLast += uint(_reserve1) / (_reserve2) * timeElapsed;
    //     }

    //     reserve1 = uint(balance1);
    //     reserve2 = uint(balance2);
    //     blockTimestampLast = blockTimestamp;
    //     emit Sync(reserve1, reserve2);
    // }

    function addLiquidityCore(uint amountIn, address from) internal lock returns (uint amountOut) {


    }

    function removeLiquidityCore(uint amountIn, address from) internal lock returns (uint amountOut) {


    }


    function swapCore(uint amountIn, address to) internal lock returns (uint amountOut) {

        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings

        amountOut = kValue / amountIn; // get ouput
   
        if (amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        emit Swap(to, amountIn, amountOut);
    }

    
    function swapReceiver(uint _amountIn, address _to) internal lock {

        uint amountOut = swapCore(_amountIn, _to);

        (bool success, ) = address(_to).call{value: amountOut}("MDEX: SWAP_SUCCESSFUL");

        if (!success) revert("MDEX: SWAP_FAILED");

    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint _amountIn, uint _gasAmount, address to) external payable lock {

        uint gas = msg.value - _amountIn;

        bytes32 messageId = mailbox.dispatch(
            LOCAL_DOMAIN,
            remoteAddress.addressToBytes32(),
            abi.encodeWithSignature('swapReceiver(uint,address)', _amountIn, to)
        );

        uint amountOut = swapCore(_amountIn, to);

        payForGas(messageId, REMOTE_DOMAIN, _gasAmount, gas, msg.sender);

        emit Swap(to, _amountIn, amountOut);
        
    }


    // gas payment
    function payForGas(
        bytes32 _messageId, 
        uint32 _destinationDomain, 
        uint256 _gasAmount,
        uint256 _value,
        address _refundAddress
        ) public payable {
        
        igp.payForGas{ value: _value }(
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
