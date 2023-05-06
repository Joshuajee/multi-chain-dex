// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IMDexLiquidityManager.sol";

interface IMDexV1NativeFactory is INonfungibleNativeLiquidity {
    event ReceivedMessage(uint32 indexed _origin, address indexed _sender, bytes _body);
    function initialize(address _mailbox, address _interchainGasPaymaster) external;
    function addLiquidity(uint32 _remoteDomain, uint _amountIn, uint _amountIn2, uint _gasAmount, address _remotrAddress) external payable;
    function removeLiquidity(uint32 _remoteDomain, uint _position, uint _gasAmount, address _remoteAddress) external payable;
    function swapReceiver(uint32 _remoteDomain, uint256 _amountOut, address _to, address _remoteAddress) external;
    function addLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, uint256 _amountIn, uint256 _amountIn2, address _sender, address _remoteAddress) external;
    function removeLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, address _owner, address _remoteAddress) external;
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external;
    struct Position {
        uint32 remoteDomain;
        uint positionId;
        address remoteAddress;
        address pair;
    }
}