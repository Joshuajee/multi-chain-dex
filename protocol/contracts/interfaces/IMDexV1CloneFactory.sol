// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;



interface IMDexV1CloneFactory {
    function nativeCloneFactory (uint32 _localDomain, uint32 _remoteDomain, address _remoteAddress) external returns (address pair);
}
