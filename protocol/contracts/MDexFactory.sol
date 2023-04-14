// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;


import './MDexPairNative.sol';

contract MDexFactory  {

    // supported chain ID and name this is the Hyperlane ID
    mapping(uint => string) public supportedChainId;

    mapping(uint => mapping(uint => address)) public getPair;
    address[] public allPairs;


    event PairCreated(uint8 indexed chain1, uint8 indexed chain2, address pair, uint);


    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(uint8 _chain1, uint8 _chain2) external returns (address pair) {

        if (_chain1 == _chain2) revert('MDEX: IDENTICAL_CHAIN');

        (uint8 chainA, uint8 chainB) = _chain1 < _chain2 ? (_chain1, _chain2) : (_chain2, _chain1);

        if (getPair[chainA][chainB] != address(0)) revert('MDEX: IDENTICAL_CHAIN');

        bytes memory bytecode = type(MDexPairNative).creationCode;
        
        bytes32 salt = keccak256(abi.encodePacked(_chain1, _chain2));
        
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        
        IMDexPairNative(pair).initialize(_chain1, _chain2);
        
        getPair[_chain1][_chain2] = pair;
        getPair[_chain2][_chain1] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        
        emit PairCreated(_chain1, _chain2, pair, allPairs.length);
    
    }

}
