// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMDexPairNative {
    event ReceivedMessage(uint32 indexed _origin, address indexed _sender, bytes _body);
    function initialize(address _mailbox, address _interchainGasPaymaster) external;
}