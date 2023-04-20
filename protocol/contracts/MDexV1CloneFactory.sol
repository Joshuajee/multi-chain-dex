// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import './MDexV1PairNative.sol';


contract MDexV1CloneFactory {


    function nativeCloneFactory (uint32 _localDomain, uint32 _destinationDomain, address _remoteAddress) external returns (address pair) {
        
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, _localDomain, _destinationDomain));

        pair = address(
            new MDexV1PairNative {salt: salt} (
                _localDomain,
                _destinationDomain, 
                _remoteAddress,
                msg.sender 
            )
        );

    }

}
