// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexPairNative.sol';



contract MDexPairNative is  HyperlaneConnectionClient, IInterchainGasPaymaster,  IMDexPairNative {

    //Events
    event Mint(address indexed sender, uint amount1, uint amount2);
    event Burn(address indexed sender, uint amount1, uint amount2, address indexed to);
    event Swap(
        address indexed sender,
        uint amount1In,
        uint amount2In,
        uint amountIn,
        uint amountOut,
        address indexed to
    );
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

    // this low-level function should be called from a contract which performs important safety checks
    function swapCore(uint amountIn, uint amountOut, address to) external lock {
        if (amountIn < 0 || amountOut < 0) revert('MDEX: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings
   
        if (amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        uint balance1;
        uint balance2;
        { // scope for _token{0,1}, avoids stack too deep errors

            //require(to != _LOCAL_DOMAIN && to != _REMOTE_DOMAIN, 'MDEX: INVALID_TO');
            // if (amountIn > 0) _safeTransfer(_LOCAL_DOMAIN, to, amountIn); // optimistically transfer tokens
            // if (amountOut > 0) _safeTransfer(_REMOTE_DOMAIN, to, amountOut); // optimistically transfer tokens
            // if (data.length > 0) MDexCallee(to).MDexCall(msg.sender, amountIn, amountOut, data);
            // balance1 = IERC20(_LOCAL_DOMAIN).balanceOf(address(this));
            // balance2 = IERC20(_REMOTE_DOMAIN).balanceOf(address(this));
        }
        // uint amount1In = balance1 > _reserve1 - amountIn ? balance1 - (_reserve1 - amountIn) : 0;
        // uint amount2In = balance2 > _reserve2 - amountOut ? balance2 - (_reserve2 - amountOut) : 0;
        // require(amount1In > 0 || amount2In > 0, 'MDEX: INSUFFICIENT_INPUT_AMOUNT');
        // { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
        // uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
        // uint balance2Adjusted = balance2.mul(1000).sub(amount2In.mul(3));
        // require(balance1Adjusted.mul(balance2Adjusted) >= uint(_reserve1).mul(_reserve2).mul(1000**2), 'MDEX: K');
        // }

        //_update(balance1, balance2, _reserve1, _reserve2);
        //emit Swap(msg.sender, amount1In, amount2In, amountIn, amountOut, to);


    }

    // this low-level function should be called from a contract which performs important safety checks
    function swapReceiver(uint amountIn, uint amountOut, address to) external lock {
        if (amountIn < 0 || amountOut < 0) revert('MDEX: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings
   
        if (amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        uint balance1;
        uint balance2;
        { // scope for _token{0,1}, avoids stack too deep errors

            //require(to != _LOCAL_DOMAIN && to != _REMOTE_DOMAIN, 'MDEX: INVALID_TO');
            // if (amountIn > 0) _safeTransfer(_LOCAL_DOMAIN, to, amountIn); // optimistically transfer tokens
            // if (amountOut > 0) _safeTransfer(_REMOTE_DOMAIN, to, amountOut); // optimistically transfer tokens
            // if (data.length > 0) MDexCallee(to).MDexCall(msg.sender, amountIn, amountOut, data);
            // balance1 = IERC20(_LOCAL_DOMAIN).balanceOf(address(this));
            // balance2 = IERC20(_REMOTE_DOMAIN).balanceOf(address(this));
        }
        // uint amount1In = balance1 > _reserve1 - amountIn ? balance1 - (_reserve1 - amountIn) : 0;
        // uint amount2In = balance2 > _reserve2 - amountOut ? balance2 - (_reserve2 - amountOut) : 0;
        // require(amount1In > 0 || amount2In > 0, 'MDEX: INSUFFICIENT_INPUT_AMOUNT');
        // { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
        // uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
        // uint balance2Adjusted = balance2.mul(1000).sub(amount2In.mul(3));
        // require(balance1Adjusted.mul(balance2Adjusted) >= uint(_reserve1).mul(_reserve2).mul(1000**2), 'MDEX: K');
        // }

        //_update(balance1, balance2, _reserve1, _reserve2);
        //emit Swap(msg.sender, amount1In, amount2In, amountIn, amountOut, to);


    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint amountIn, uint amountOut, address to, bytes calldata data) external lock {

        bytes32 messageId = mailbox.dispatch(
            LOCAL_DOMAIN,
            remoteAddress.addressToBytes32(),
            abi.encodeWithSignature('swapReceiver(uint amountIn, uint amountOut, address to, bytes calldata data)', amountIn, amountOut, to, data)
        );
        
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
