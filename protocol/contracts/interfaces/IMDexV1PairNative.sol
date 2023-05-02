// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IMDexLiquidityManager.sol";

interface IMDexV1PairNative is INonfungibleNativeLiquidity {
    event ReceivedMessage(uint32 indexed _origin, address indexed _sender, bytes _body);
    function initialize(address _mailbox, address _interchainGasPaymaster) external;
    function addLiquidityCore(bytes32 id, uint amountIn1, uint amountIn2, address sender) external returns(uint); 
    function swapCore(uint _amountIn, address _to) external returns (uint amountOut);
    function swapPay(uint _amountOut, address _to) external;
    function generateId(address _sender) external view returns (bytes32);
    function getPosition(uint _tokenId) external view returns (LiquidityToken memory);
}