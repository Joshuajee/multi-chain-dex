// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMDexPairNative {
    function initialize(uint8 _chain1, uint8 _chain2) external;
    function skim(address to) external;
    function sync() external;
}