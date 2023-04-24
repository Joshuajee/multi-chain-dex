// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IMDexLiquidityManager.sol";

interface IMDexV1NativeFactory is INonfungibleNativeLiquidity {
    event ReceivedMessage(uint32 indexed _origin, address indexed _sender, bytes _body);
    function initialize(address _mailbox, address _interchainGasPaymaster) external;
    //function addLiquidityCore(bytes32 id, uint amountIn1, uint amountIn2, address sender) internal;
    // function getPendingPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory);
    // function getOpenedPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory); 
    // function getClosedPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory);
    //function removeLiquidityCore(uint amountIn, address from) internal returns (uint amountOut);
    //function swapCore(uint amountIn, address to) internal returns (uint amountOut);
    function addLiquidity(uint32 _remoteDomain, uint _amountIn, uint _amountIn2, uint _gasAmount, address _remotrAddress) external payable;
    //function removeLiquidity(uint amountIn, address from) external;
    //function swap(uint _amountIn, uint _gasAmount, address _to) external payable;

    function addLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, uint256 _amountIn, uint256 _amountIn2, address _sender, address _remoteAddress) external;
    function swapReceiver(uint256 _amountIn, address  _to) external;

    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external;
}