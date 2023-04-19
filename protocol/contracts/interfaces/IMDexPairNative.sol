// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMDexPairNative {
    event ReceivedMessage(uint32 indexed _origin, address indexed _sender, bytes _body);
    function initialize(address _mailbox, address _interchainGasPaymaster, address _interchainSecurityModule) external;
    //function addLiquidity(bytes32 id, uint amountIn1, uint amountIn2, address sender) external;
    // function getGas(uint _amount, uint _value) external view returns(uint);
    // function generateId(address _sender) external view returns (bytes32);

}