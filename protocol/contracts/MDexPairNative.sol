// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import './interfaces/IMDexPairNative.sol';


contract MDexPairNative is IMDexPairNative {

    // Hyperlane Address
    address public hyperlaneCore = 0xCC737a94FecaeC165AbCf12dED095BB13F037685;
    address public hyperlanePayMaster = 0xF90cB82a76492614D07B82a7658917f3aC811Ac1;

    uint public constant MINIMUM_LIQUIDITY = 10**3;

    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));

    address public factory;

    uint public chainId1;
    uint public chainId2;

    address public address1;
    address public address2;

    uint private reserve1;       
    uint private reserve2;  
            
    uint32  private blockTimestampLast; 

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kValue; // 

    uint private unlocked = 1;
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

    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'MDEX: TRANSFER_FAILED');
    }

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

    constructor(){
        factory = msg.sender;
    }

    function initialize (uint8 _chainId1, uint8 _chainId2) external {
        chainId1 = _chainId1;
        chainId2 = _chainId2;
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(uint balance1, uint balance2, uint _reserve1, uint _reserve2) private {
     
        uint32 blockTimestamp = uint32(block.timestamp);

        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        if (timeElapsed > 0 && _reserve1 != 0 && _reserve2 != 0) {
            // * never overflows, and + overflow is desired
            price0CumulativeLast += uint(_reserve2) / (_reserve1) * timeElapsed;
            price1CumulativeLast += uint(_reserve1) / (_reserve2) * timeElapsed;
        }

        reserve1 = uint(balance1);
        reserve2 = uint(balance2);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve1, reserve2);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint amountIn, uint amountOut, address to, bytes calldata data) external lock {
        if (amountIn < 0 || amountOut < 0) revert('MDEX: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings
   
        if (amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        uint balance1;
        uint balance2;
        { // scope for _token{0,1}, avoids stack too deep errors

            //require(to != _chainId1 && to != _chainId2, 'MDEX: INVALID_TO');
            // if (amountIn > 0) _safeTransfer(_chainId1, to, amountIn); // optimistically transfer tokens
            // if (amountOut > 0) _safeTransfer(_chainId2, to, amountOut); // optimistically transfer tokens
            // if (data.length > 0) MDexCallee(to).MDexCall(msg.sender, amountIn, amountOut, data);
            // balance1 = IERC20(_chainId1).balanceOf(address(this));
            // balance2 = IERC20(_chainId2).balanceOf(address(this));
        }
        // uint amount1In = balance1 > _reserve1 - amountIn ? balance1 - (_reserve1 - amountIn) : 0;
        // uint amount2In = balance2 > _reserve2 - amountOut ? balance2 - (_reserve2 - amountOut) : 0;
        // require(amount1In > 0 || amount2In > 0, 'MDEX: INSUFFICIENT_INPUT_AMOUNT');
        // { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
        // uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
        // uint balance2Adjusted = balance2.mul(1000).sub(amount2In.mul(3));
        // require(balance1Adjusted.mul(balance2Adjusted) >= uint(_reserve1).mul(_reserve2).mul(1000**2), 'MDEX: K');
        // }

        _update(balance1, balance2, _reserve1, _reserve2);
        //emit Swap(msg.sender, amount1In, amount2In, amountIn, amountOut, to);
    }

    // force balances to match reserves
    function skim(address to) external lock {
        //address _chainId1 = chainId1; // gas savings
        //address _chainId2 = chainId2; // gas savings
        // _safeTransfer(_chainId1, to, IERC20(_chainId1).balanceOf(address(this)).sub(reserve1));
        // _safeTransfer(_chainId2, to, IERC20(_chainId2).balanceOf(address(this)).sub(reserve2));
    }

    // force reserves to match balances
    function sync() external lock {
        //_update(IERC20(chainId1).balanceOf(address(this)), IERC20(chainId2).balanceOf(address(this)), reserve1, reserve2);
    }
}
